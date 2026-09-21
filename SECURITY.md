# Security

This document describes Syncro's security architecture, the threat model behind each control, and the outcome of the most recent internal security audit. For system design context (data model, caching, real-time pipelines), see [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Reporting a vulnerability

Please do not open a public GitHub issue for a suspected vulnerability. Open a private security advisory on this repository, or contact the maintainer directly.

## Authentication & session model

- **Credential storage**: Passwords are hashed with `bcrypt` (cost factor 12). Verification codes and password-reset tokens are never stored in plaintext — only their SHA-256 hash is persisted, with the raw value sent once via email and never logged in production.
- **Login is two-factor by default**: password verification is followed by a 6-digit, time-boxed (5 min), rate-limited (3 attempts / 60s lockout) email code before a session is issued.
- **Session transport**: on successful login, the server issues the JWT access token (15 min TTL) and refresh token (7 day TTL) as `httpOnly`, `Secure` (in production), `SameSite=Strict` cookies. The client holds no copy of the JWT in `localStorage`, `sessionStorage`, or any other JS-readable storage — this closes the standard XSS-token-theft vector for browser sessions. A `Bearer` header is still accepted by `protect` middleware as a fallback transport for non-browser API clients (e.g. server-to-server integrations), which do not rely on cookies and are therefore not subject to CSRF.
- **CSRF**: because auth now rides on a cookie, state-changing requests (`POST`/`PUT`/`PATCH`/`DELETE`) are protected by an anchor-cookie / synchronizer-token scheme (`server/src/middlewares/csrf.js`). The app (`syncro.piyushydv.com`) and API (`api.syncro.piyushydv.com`) are on different subdomains, so a classic *readable* double-submit cookie doesn't work here — a host-only cookie set by the API is invisible to `document.cookie` on the app's page. Instead: the server sets an `httpOnly` `syncro_csrf_token` cookie (auto-attached by the browser on every request back to the API, same as the session cookies) and separately hands the client that same value once, in the JSON body of the login/refresh/`me` responses. The client holds it in memory and echoes it back as an `X-CSRF-Token` header on every mutating request; the server compares header against cookie with a timing-safe check. This check is skipped only for `Bearer`-authenticated requests, since a cross-site request forged against a victim's browser cannot attach an `Authorization` header on the victim's behalf.
- **Revocation**: every issued token carries a unique `jti`. Logout, password reset, and "revoke session" all blacklist the relevant `jti` in Redis, checked on every `protect` and Socket.IO handshake. Password reset additionally revokes *all* active sessions for that user in the same transaction as the password change.
- **Real-time (Socket.IO)**: the WebSocket handshake authenticates via the same `httpOnly` cookie (parsed off `socket.handshake.headers.cookie`), with `Bearer`/query-token as a fallback for non-browser clients. Socket.IO's CORS allowlist is the same allowlist used by the HTTP layer (`server/src/config/corsPolicy.js`) — a wildcard origin combined with `credentials: true` is a well-known misconfiguration and is deliberately avoided here.

## Authorization

- Every domain route is mounted behind `protect` (JWT/cookie verification); most are additionally scoped by workspace/project/role membership checks inside the controller (e.g. `hasWorkspacePermission`, `hasProjectAccess`) rather than trusting a client-supplied workspace/project ID at face value.
- Super-admin routes require `requireSuperAdmin`, which checks an env-configured email allowlist and a DB/Redis-cached `isSuperAdmin` flag.
- A full authorization/IDOR sweep across every controller (workspace, project, task, chat, whiteboard, roles, audit, epic, sprint, retro, milestone, portfolio, inbox, meeting, subteam, comment) was completed as part of this audit — see **Audit history** below for the one finding it surfaced.

## Transport & browser security

- HTTP responses set `Content-Security-Policy` (no `unsafe-inline` for scripts — the client bundle has no inline `<script>` tags), `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin` via `helmet` (`server/src/middlewares/securityHeaders.js`).
- CORS is an explicit allowlist (configured origins + a documented domain-suffix allowlist), not a wildcard, and is shared between the HTTP and Socket.IO layers.
- Request bodies are capped at 100kb and pass through a server-side HTML sanitizer (`sanitize-html`) before reaching any controller, in addition to React's default JSX escaping on the client.

## Encryption at rest

Sensitive columns (`User.googleAccessToken`, `User.googleRefreshToken`, `User.twoFactorCode`, `Message.content`, `Comment.content`) are transparently encrypted with AES-256-GCM via a Prisma Client extension (`server/src/config/prisma.js`) — encrypted on every write, decrypted on every read, with a random IV and authentication tag per value. See [`ARCHITECTURE.md §3.3`](./ARCHITECTURE.md).

## Database-level tenant isolation (Row Level Security) — declared, not active

`prisma/migrations/20260816_enable_rls/migration.sql` enables Postgres Row Level Security on `Project`, `Channel`, and `Meeting`, with a policy scoping rows to `current_setting('app.current_workspace_id', true)`. Reading the migration in isolation could suggest the database itself enforces tenant isolation on these tables. It does not, today:

- No application code ever calls `set_config('app.current_workspace_id', ...)` — confirmed by grepping the entire server for that setting and for `SET LOCAL`. The variable is never set, on any request path.
- The application's Prisma connection (`server/src/config/prisma.js`) connects as the same Postgres role that owns these tables (or, in local/CI Postgres, a superuser). Postgres does not apply RLS policies to a table's owner — and never to a superuser — unless the table also has `FORCE ROW LEVEL SECURITY`, which this migration does not set.
- Net effect: the policies are currently inert for the app's real traffic. Tenant isolation for `Project`, `Channel`, and `Meeting` is enforced entirely by application-layer authorization (`checkProjectAccessMiddleware`, `hasWorkspacePermission`, and the controller-level workspace/project membership checks described under **Authorization** above) — not by the database.

`server/tests/rlsIsolation.test.js` (`npm run test:rls`, included in `test:integration`) verifies this precisely, against a throwaway local Postgres role with only `SELECT` granted (never the app's real role):

- Scoped to workspace A via a transaction-local `set_config('app.current_workspace_id', <id>, true)` — the correct pattern over Prisma's pooled connections, since a bare `SET` would leak across pooled connections — the role sees only workspace A's rows, cannot read workspace B's project by id, and is symmetric for workspace B.
- With the scope never set, the same non-owner role sees **zero** rows (fails closed) — proving the policies themselves are logically sound.
- Querying as the table owner (what the app actually does) with no scope set returns rows from **both** tenants — proving today's real, unprotected behavior.

Activating this for real would mean the app connecting as a non-owner role, adding `FORCE ROW LEVEL SECURITY`, and wrapping every `Project`/`Channel`/`Meeting` query in a transaction that sets the scope first — a cross-cutting change to DB role provisioning and every touching controller. That's deliberately not attempted here: doing it partially would be worse than the current honest gap, since a half-migrated app role would either break unrelated queries or silently leave some access paths unscoped. See **Known gaps / follow-ups** below.

## The Shield layer

Syncro additionally runs an application-layer encrypted tunnel (`server/src/services/shieldEngine.js`, documented in full in [`ARCHITECTURE.md §7`](./ARCHITECTURE.md)) using ephemeral ECDH P-256 key agreement, HKDF-SHA256 key derivation, AES-256-GCM payload encryption, and HMAC-SHA256 request signing with an atomic replay-nonce guard. See [`ARCHITECTURE.md § Design Trade-offs & Honest Limitations`](./ARCHITECTURE.md#-design-trade-offs--honest-limitations) for the precise, falsifiable version of what this does and doesn't add over TLS, and why it exists in a project that doesn't strictly need it.

**What it defends against**: a passive observer with access to the browser's DevTools/network tab, a malicious browser extension reading `fetch`/XHR traffic, or plaintext logging by a misconfigured reverse proxy/CDN sitting between TLS termination and the application. None of these are protected by TLS alone, since TLS only secures the wire between two trusted endpoints — it does nothing once either endpoint (or something with visibility inside the browser) is compromised or misconfigured.

**What it does not defend against**, and does not claim to: a fully active man-in-the-middle at the same trust boundary as the TLS session itself (e.g. a compromised CA or an attacker-installed root certificate on the client device) could intercept the ECDH handshake the same way it could intercept TLS. This is an accepted, documented limitation, not a bug — closing it would require client certificate pinning, which is out of scope for a browser-based SPA.

**Operational note**: the anti-replay nonce store and session store fall back to an in-process `Map`/`Set` if Redis is unreachable. That fallback is correct for a single instance but does not provide replay protection across horizontally scaled instances — this is fine given Redis is the expected production configuration (the same Redis instance also backs the Socket.IO adapter for multi-instance fan-out), but is worth knowing if Shield is ever run multi-instance without Redis configured.

## Dependency management

- `npm audit` is run in CI for both `server` and `client`, gated at `--audit-level=high`.
- One high-severity finding is a documented, accepted exception: `GHSA-ggr8-5vv4-36mx` (`deepmerge-ts`, pulled in transitively by the `prisma` CLI's `@prisma/config`) currently affects every Prisma 6.13+ release including the latest, with no non-breaking fix available. It is a dev/build-time-only dependency — `prisma generate` runs against a trusted, developer-authored `schema.prisma`, never against untrusted request input — so real-world exploitability is negligible. The CI audit step explicitly allowlists only this chain (`server/package.json`'s `deepmerge-ts` / `@prisma/config` / `prisma` entries) and fails on anything else.

## Known gaps / follow-ups

- **Row Level Security is declared but not activated** — see **Database-level tenant isolation** above for the full detail. The migration's policies are correct in isolation (verified by `server/tests/rlsIsolation.test.js`), but the app never sets `app.current_workspace_id` and connects as a role RLS doesn't restrict, so they provide no protection today. Tenant isolation for `Project`/`Channel`/`Meeting` currently relies entirely on application-layer checks. Closing this gap for real requires a non-owner app DB role, `FORCE ROW LEVEL SECURITY`, and a transaction-scoped `set_config` wrapper around every access path for those three models — deferred as a deliberate, larger architecture change rather than half-implemented.
- **Local dev's `.env` points at a live Neon database _and_ a live Upstash Redis instance, not isolated ones.** This is normal for a solo project without a staging environment, but it means running `test:integration` locally with `.env` in place (as opposed to in CI, see below, which sets neither) exercises real, shared infrastructure — `gatekeeper.test.js` does one real Prisma read, and its super-admin-cache assertions write/read real keys (`user:is_superadmin:*`) on the live Redis. Worth knowing before running tests locally with `.env` in place; prefer overriding `DATABASE_URL`/`DIRECT_URL` to a local Postgres and leaving `UPSTASH_REDIS_REST_URL`/`TOKEN` unset, matching what CI does.
- Shield's in-memory replay-guard fallback (above) should be revisited if Shield is ever deployed multi-instance without Redis.
- ~~Test environment lacks database isolation in CI~~ — **closed 2026-09-20**. CI now provisions an ephemeral `postgres:16` service container per run (`.github/workflows/ci.yml`) and runs the full `test:integration`/`test:domain` suites against it.
- ~~Migration history has no baseline, so `prisma migrate deploy` fails against an empty database~~ — **closed 2026-09-21.** See **Migration history baseline** below.
- ~~`gatekeeper.test.js` intermittently fails~~ — **closed 2026-09-21, and the original diagnosis was wrong.** This was previously attributed to "network-latency/timing sensitivity" against the live Neon database. It wasn't: the real cause was a genuine logic bug in `checkIsSuperAdmin` (`server/src/services/gatekeeperService.js`) and `requireSuperAdmin` (`server/src/middlewares/superAdminMiddleware.js`), both of which compared a cached value with `=== 'true'` / `=== 'false'` (string equality). That works against the in-memory Redis fallback (used in CI, since `UPSTASH_REDIS_REST_URL`/`TOKEN` are unset there), but breaks deterministically — not intermittently — whenever a real Upstash Redis client is configured: Upstash's client auto-deserializes any JSON-parseable stored value, so a stored `'true'`/`'false'` string comes back as an actual boolean, and `true === 'true'` is `false`. The practical impact was limited (the check silently fell through to a live DB read instead of granting or denying access incorrectly — no privilege escalation), but the caching was completely defeated whenever real Upstash was in play, and the test failures traced directly to it. Fixed by comparing against both the string and boolean forms. Verified by running `gatekeeper.test.js` against the live Upstash instance this repo's own `.env` points at: 2 of 13 assertions failed before the fix, 13/13 passed after, both runs against the real service (test keys cleaned up from that Redis instance immediately after). CI provisions its ephemeral schema via `prisma migrate deploy` — see **Migration history baseline** below for the fix that made that possible.

## Migration history baseline

`prisma/migrations/` previously had no baseline migration — the base schema was originally pushed directly to the database via `prisma db push`, never captured as a migration, so `prisma migrate deploy` against a genuinely empty database failed with `P3018` ("relation does not exist"). CI routed around this with `db push` + applying the two existing migration files' raw SQL directly (see the old version of `.github/workflows/ci.yml`'s "Provision ephemeral schema" step).

Fixed by generating a baseline migration from the current schema and adding the previously-missing `prisma/migrations/migration_lock.toml`:

```bash
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
```

placed at `prisma/migrations/20260815_baseline_schema/migration.sql` — named to sort before the two existing migrations (`20260816_enable_rls`, `20260816_partial_unique_indexes`). Verified against a fresh, empty local Postgres: `prisma migrate deploy` applies all three migrations cleanly, `prisma migrate status` reports "up to date," a diff between the resulting schema and `schema.prisma` is empty (zero drift), and the full `test:integration` suite (10/10 suites) passes against a database provisioned this way. CI now runs `npx prisma migrate deploy` directly instead of the `db push` + raw-SQL workaround.

**This does not touch the live database.** The live database already has this exact schema (applied historically via `db push`, plus the RLS/index migrations applied at some point outside Prisma's migration tracking), so Prisma has no record of any of these three migrations being "applied" there. Running `prisma migrate deploy` against it as-is would try to re-run the baseline's `CREATE TABLE` statements and fail on already-existing tables. To mark the baseline as already applied in production **without running any migration SQL against it**, run manually, against the production `DATABASE_URL`/`DIRECT_URL` (never automated, never run by CI or by an agent):

```bash
cd server
# First, confirm what Prisma currently thinks is applied:
npx prisma migrate status

# Mark each migration as already applied (this only writes a row to the
# _prisma_migrations tracking table — it does NOT execute the migration's SQL):
npx prisma migrate resolve --applied 20260815_baseline_schema
npx prisma migrate resolve --applied 20260816_enable_rls
npx prisma migrate resolve --applied 20260816_partial_unique_indexes

# Confirm it's now clean:
npx prisma migrate status   # should report "Database schema is up to date!"
```

Before running the `enable_rls`/`partial_unique_indexes` resolve commands, confirm those two migrations' SQL has actually already been applied to production (e.g. `SELECT * FROM pg_policies WHERE tablename = 'Project';` should show the tenant isolation policy, and the partial unique indexes should already exist) — if either hasn't been applied for real, resolve only the baseline and then run `prisma migrate deploy` normally so Prisma applies the remaining one(s) for real, rather than marking unapplied SQL as "applied."

## Audit history

**2026-09-20 — Full server + client security audit.**

- **[Critical, fixed]** `POST /api/tasks/:id/recur-test` had no authorization check at all — any authenticated user could clone an arbitrary task in any workspace by ID, regardless of membership. It was a leftover manual-test endpoint (never wired to a scheduler), also exposed via a "Trigger Recurrence Clone (Dev Test)" button in the production task UI. Removed end-to-end (route, controller, client hook, and UI button).
- **[High, fixed]** `helmet` and `sanitize-html` were imported with a try/catch fallback but were never actually installed as dependencies — both were silently running on weaker native fallback implementations with no build-time or runtime warning. Installed for real.
- **[High, fixed]** The client stored the JWT in `localStorage` and attached it via an `Authorization` header on every request, in addition to the `httpOnly` cookie the server already issued — defeating the cookie's XSS protection. Migrated the client to cookie-only auth (see **Authentication & session model** above) and added CSRF protection to compensate.
- **[Medium, fixed]** Client-side logout only cleared local state — it never called the server, so the session's `jti` was never revoked. An attacker who had captured a token/cookie before "logout" could still use it until natural expiry. Logout now calls `POST /api/auth/logout`, which revokes the session server-side.
- **[Medium, fixed]** Socket.IO's CORS config used `origin: "*"` combined with `credentials: true` — a known-dangerous combination that effectively allows any origin to ride an authenticated socket session. Now uses the same origin allowlist as the HTTP layer.
- **[Low, fixed]** `Content-Security-Policy` included `script-src 'unsafe-inline'`, undermining CSP's main XSS defense; the client bundle has no inline scripts, so it was dropped.
- **[Low, fixed]** A hardcoded 2FA bypass code (`'123456'`, gated on `NODE_ENV !== 'production'`) was removed — the real per-login code is already logged in development, making the bypass redundant and a needless risk if `NODE_ENV` is ever misconfigured in a deployment.
- **[Low, fixed]** `POST /api/auth/verify-login` and `POST /api/auth/resend-code` were missing the DTO validation layer every other auth route uses.
- **[Caught in review, fixed before shipping]** The first CSRF design used a JS-readable cookie (classic double-submit). The app and API are on different subdomains (`syncro.piyushydv.com` / `api.syncro.piyushydv.com`), so a host-only cookie set by the API is invisible to `document.cookie` on the app's page — this would have 403'd every authenticated write in production while working fine in local dev, where cookie-domain quirks mask the bug. Redesigned to the anchor-cookie/synchronizer-token scheme described above before it ever shipped.
- **[Caught in review, fixed before shipping]** The CSRF middleware was mounted at the router level (all HTTP methods), but the client only ever attaches the CSRF header on mutating requests — every `GET` would have 403'd. Caught via a live curl smoke test; fixed by scoping the check to state-changing methods, with a regression test added for exactly this case.
- **[Low, fixed]** `POST /api/google-calendar/disconnect` was missed in the first CSRF-wiring pass (it's mounted outside the routers the other domains share) — closed.
- 14 of 17 npm-audited CVEs across both packages resolved via `npm audit fix`; the remaining one is the documented Prisma CLI exception above.
- A dedicated Shield-layer review (crypto primitives, replay guard, signature verification) found the implementation sound; see **The Shield layer** above for its two documented, accepted limitations.

**2026-09-20 (same day, follow-up pass) — CI database isolation, and a documentation-accuracy pass on marketing language.**

- Wired a real ephemeral `postgres:16` CI service container and re-enabled `test:integration`/`test:domain` (previously excluded — see **Known gaps / follow-ups** above for what changed and the flaky-test root cause it resolved).
- Audited every place this project's docs claimed "Enterprise," "Zero-Trust," or "100% Cloaked" — replaced with precise, falsifiable claims, or cut where nothing backed them. Added [`ARCHITECTURE.md § Design Trade-offs & Honest Limitations`](./ARCHITECTURE.md#-design-trade-offs--honest-limitations), which states plainly what Shield does and does not add over TLS.
- Found and fixed a live, runtime instance of the same issue (not just docs): the public, unauthenticated `/health` endpoint hardcoded `"driver": "Prisma Client (Enterprise)"` in its JSON response — a real deployed API returning an unfalsifiable label. Now just `"Prisma Client"`.
- Replaced stale/aspirational test-count claims in `README.md` and `ARCHITECTURE.md` with real, current, re-run numbers (including one doc that claimed `100% Pass Rate` while actually referencing a suite with 2 known failures).

**2026-09-21 — Correctness/authorization audit and documentation reconciliation.**

- **Row Level Security**: found the `Project`/`Channel`/`Meeting` RLS policies are declared but never activated (app never sets `app.current_workspace_id`, connects as a role RLS doesn't restrict). Rather than half-implement app-role/transaction plumbing, documented the precise gap (see **Database-level tenant isolation** above) and added `server/tests/rlsIsolation.test.js`, which proves the policies are logically correct against a throwaway non-owner role while also proving today's real (unprotected) behavior.
- **[High, fixed]** `POST /api/portfolios/:id/projects` and `DELETE /api/portfolios/:id/projects/:projectId` had no authorization check at all (not even portfolio ownership) and didn't verify an added `projectId` belongs to the portfolio's own workspace — any authenticated user could inject another workspace's project into a portfolio, surfacing its name/progress/tasks/milestones via `getPortfolioById`. Fixed.
- **[High, fixed]** `getSprintRetro`'s `hasAccess` helper never checked the requesting user at all — it returned truthy for any sprint that existed, so any authenticated user could view or initialize any workspace's retro board. `addRetroItem`/`voteRetroItem` had no access check whatsoever. All three now verify real project access.
- **[Medium, fixed]** `createTask`/`updateTask` connected `sprintId`/`epicId`/`milestoneId`/`dependenciesIds`/`assigneeId` from the request body without checking they belong to the same project as the task — a cross-project/cross-workspace IDOR class. Same missing check found and fixed in `createMeeting`/`updateMeeting` (projectId, invitees), `createWhiteboard` (projectId), `updateCapacity` (userId), and `sendMessage` (parentId letting a reply be injected into a thread the sender has no access to). See `server/tests/taskForeignRefs.test.js`.
- **[Medium, fixed]** Neither the `whiteboard:update` socket broadcast nor the REST `saveWhiteboard` endpoint enforced the `manageWhiteboards` permission that already exists in the role model (a VIEWER-role member could edit/broadcast like any other member). Both now require it.
- **[Medium, fixed — real bug, not a test flake]** `checkIsSuperAdmin`/`requireSuperAdmin` compared a cached value with `=== 'true'`/`'false'` (string equality), which silently breaks whenever a real Upstash Redis client is configured (it auto-deserializes a stored boolean-looking string back into an actual boolean). This is what caused `gatekeeper.test.js`'s previously-documented "flake" — see **Known gaps / follow-ups** above for the full correction; it was never a timing issue.
- Found and fixed a real transaction-context bug in the Prisma soft-delete extension (`server/src/config/prisma.js`): `findUnique`/`findUniqueOrThrow` on a soft-delete model called `basePrisma` directly instead of the transaction-scoped `query`, so reading a row back inside the same `$transaction` that just created it (as `createTask`/`updateTask` do) returned `null`. Surfaced while writing `taskForeignRefs.test.js`; confirmed by running that test against the pre-fix code.
- Repo hygiene: removed committed `.DS_Store` files, added an MIT `LICENSE` (none existed) and aligned `license` fields across all three `package.json` files, deduped `client/public/Lanidng page images` (5 of 6 files were byte-identical to `client/public/screenshots/*`, and the folder had zero code references) into a typo-fixed `Landing page images`, and created `docs/walkthrough.md` (previously a dead link) with real screenshots.
- Reconciled `README.md`, `ARCHITECTURE.md`, and `.github/workflows/ci.yml` so all three agree on what `gatekeeper.test.js` actually does and why, replaced the unverifiable "1.63 MB -> 566 kB" bundle claim with fresh, verified per-chunk `npm run build` numbers, and re-ran every test suite (server unit/security/integration/domain/db, client unit) to confirm the numbers cited: **60/60** server unit, **41/41** security, **229/229** across **10/10** integration suites, **93/93** domain, **8/8** db, **21/21** client.
- Whiteboard sync (`whiteboard:update`) documented as last-write-wins with no CRDT/OT merge (`README.md`, `ARCHITECTURE.md`) — behavior unchanged, just not previously stated. `shieldEngine.getSession`'s empty `catch {}` now logs via the structured logger. `ARCHITECTURE.md`'s Design Trade-offs section now states precisely that the Shield ECDH handshake is unauthenticated (no server-key signing/pinning) and that session keys are stored as plain hex in Redis/memory. Moved the four Shield-specific bullets in `README.md` out of the headline feature list into a new "Experimental / Defense-in-Depth" section.
- **Note on this audit's own methodology**: two of the fixes above (the gatekeeper cache bug, the Prisma transaction bug) were verified against real external services this repo's `.env` points at — a live Upstash Redis instance (deliberately, to prove the fix against the actual service exhibiting the bug; test keys were deleted immediately after) and, once inadvertently, the same Redis during an early baseline run before test env vars were fully isolated (also cleaned up). No live Postgres database was written to at any point — all Postgres-touching tests and fixes ran against a local, throwaway instance.
