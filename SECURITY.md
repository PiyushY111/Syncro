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

## The Shield layer

Syncro additionally runs an application-layer encrypted tunnel (`server/src/services/shieldEngine.js`, documented in full in [`ARCHITECTURE.md §7`](./ARCHITECTURE.md)) using ephemeral ECDH P-256 key agreement, HKDF-SHA256 key derivation, AES-256-GCM payload encryption, and HMAC-SHA256 request signing with an atomic replay-nonce guard.

**What it defends against**: a passive observer with access to the browser's DevTools/network tab, a malicious browser extension reading `fetch`/XHR traffic, or plaintext logging by a misconfigured reverse proxy/CDN sitting between TLS termination and the application. None of these are protected by TLS alone, since TLS only secures the wire between two trusted endpoints — it does nothing once either endpoint (or something with visibility inside the browser) is compromised or misconfigured.

**What it does not defend against**, and does not claim to: a fully active man-in-the-middle at the same trust boundary as the TLS session itself (e.g. a compromised CA or an attacker-installed root certificate on the client device) could intercept the ECDH handshake the same way it could intercept TLS. This is an accepted, documented limitation, not a bug — closing it would require client certificate pinning, which is out of scope for a browser-based SPA.

**Operational note**: the anti-replay nonce store and session store fall back to an in-process `Map`/`Set` if Redis is unreachable. That fallback is correct for a single instance but does not provide replay protection across horizontally scaled instances — this is fine given Redis is the expected production configuration (the same Redis instance also backs the Socket.IO adapter for multi-instance fan-out), but is worth knowing if Shield is ever run multi-instance without Redis configured.

## Dependency management

- `npm audit` is run in CI for both `server` and `client`, gated at `--audit-level=high`.
- One high-severity finding is a documented, accepted exception: `GHSA-ggr8-5vv4-36mx` (`deepmerge-ts`, pulled in transitively by the `prisma` CLI's `@prisma/config`) currently affects every Prisma 6.13+ release including the latest, with no non-breaking fix available. It is a dev/build-time-only dependency — `prisma generate` runs against a trusted, developer-authored `schema.prisma`, never against untrusted request input — so real-world exploitability is negligible. The CI audit step explicitly allowlists only this chain (`server/package.json`'s `deepmerge-ts` / `@prisma/config` / `prisma` entries) and fails on anything else.

## Known gaps / follow-ups

- **Test environment lacks database isolation.** `server/.env` (gitignored, never committed) points at a live Neon database rather than an isolated test instance. The `test:integration` suite (`server/tests/runAllTests.js`) is therefore deliberately **not** run in CI yet — most of its suites simulate their scenarios in-memory or mock Prisma/Redis, but `gatekeeper.test.js` does exercise the real Prisma client for one read. Recommended follow-up: provision a dedicated test database (a Neon branch or a CI Postgres service container) before re-enabling this suite in CI.
- Shield's in-memory replay-guard fallback (above) should be revisited if Shield is ever deployed multi-instance without Redis.

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
- 14 of 17 npm-audited CVEs across both packages resolved via `npm audit fix`; the remaining one is the documented Prisma CLI exception above.
- A dedicated Shield-layer review (crypto primitives, replay guard, signature verification) found the implementation sound; see **The Shield layer** above for its two documented, accepted limitations.
