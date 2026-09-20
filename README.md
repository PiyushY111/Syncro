# 🚀 Syncro: Collaborative Team Workspace

```text
  ██████  ██    ██ ███    ██  ██████ ██████   ██████  
 ██       ██    ██ ████   ██ ██      ██   ██ ██    ██ 
  █████   ██    ██ ██ ██  ██ ██      ██████  ██    ██ 
       ██  ██  ██  ██  ██ ██ ██      ██   ██ ██    ██ 
  ██████    ████   ██   ████  ██████ ██   ██  ██████  
                                                      
   A DEVELOPER-CENTRIC TEAM COLLABORATION HUB
```

[![CI](https://github.com/PiyushY111/Syncro/actions/workflows/ci.yml/badge.svg)](https://github.com/PiyushY111/Syncro/actions/workflows/ci.yml)
[![Security Policy](https://img.shields.io/badge/security-policy-blue)](./SECURITY.md)

---

## 📝 Project Description
**Syncro** is a developer-centric team collaboration platform for product squads and engineering teams. It combines real-time collaborative whiteboards, a Slack-like messaging system, automated background pipelines, a granular role-based permission system, and email-based two-factor authentication into a single workspace.

The platform isolates data between workspace organizations, offloads async work to event-driven background workers (Inngest), and uses WebSockets for low-latency state synchronization between clients.

---

## 🌐 Live Demo & Screenshots
* **Production URL**: [https://syncro.piyushydv.com](https://syncro.piyushydv.com)
* **API Gateway Service**: [https://api.syncro.piyushydv.com](https://api.syncro.piyushydv.com)
* **Screenshots and Walkthroughs**: See the `docs/walkthrough.md` file in this repository, or the demo video linked in the repo description. *(If reviewing this on GitHub, screenshots are embedded directly in `/docs`.)*

---

## ✨ Features

### 1. Live Collaborative Whiteboards
* **Vector Drawing Canvas** — low-latency coordinate mapping for drafting plans and system architectures.
* **Sticky Notes & Nodes** — drag-and-drop sticky notes, connecting arrows, and task-node links.
* **Cursor Broadcasting** — real-time broadcast of member mouse coordinates across browsers via Socket.IO.
* **SVG Vector Export** — single-click export of canvas elements to formatted SVG.

### 2. Rich Messaging Directory
* **Public & Private Channels** — multi-channel setups with invite-only membership controls.
* **Direct Messaging (DMs)** — private 1-on-1 threads with full workspace member indexing.
* **Threaded Replies & Pins** — star channels, pin messages, and discuss details in slide-out thread panels.

### 3. Task & Project Pipelines
* **Interactive Kanban Board** — drag-and-drop tasks across stages (TODO, IN_PROGRESS, DONE) with instant socket broadcasts.
* **Gantt Timeline Schedules** — view tasks, assignees, and milestones on a scheduled calendar timeline.
* **Dependency Mapper** — block tasks or map blocking dependencies, with checks to prevent cyclic dependencies.

### 4. Agile Scrum & Team Workflows
* **Sprint & Epic Planning** — manage sprint lifecycles, capacity tracking, epic milestones, and task allocations.
* **Sprint Retrospectives** — real-time retro boards with item creation, category grouping (Went Well, To Improve, Action Items), and upvoting via Socket.IO.
* **Sub-teams & Role Matrix** — assign workspace members to sub-teams and custom role permissions.

### 5. Performance & Dynamic Code-Splitting
* **Route-Level Code-Splitting (`React.lazy` + `Suspense`)** — dynamic on-demand loading of all 25 page routes; slashes initial production bundle size by 65% (down from 1.63 MB to 566 kB) and eliminates unbundled dev module network congestion.
* **In-Flight Request Deduplication** — prevents concurrent components from triggering duplicate network requests for the same resource.
* **Stale-While-Revalidate (SWR) Caching** — delivers instantaneous 0ms UI transitions from memory cache while revalidating data quietly in the background.
* **Optimized Database Queries** — selective database projections and sub-query indexing deliver millisecond workspace retrieval.
* **Redis Caching** — workspace lists, role checks, and notification inbox feeds are cached in Redis with L2 read-through fallback.
* **Service Worker** — scoped to production environments for offline static shell caching, avoiding interception of Vite dev-server HMR modules.

### 6. Security & Cryptography: Syncro Shield
* **Application-layer payload cloaking, not endpoint secrecy** — API routes are dispatched through a single encrypted gateway (`POST /api/v2/shield/dispatch`), so a passive DevTools Network-tab view or a misconfigured proxy log sees ciphertext, not plaintext endpoint names or bodies. This is *not* a claim that the endpoints are hidden from a motivated attacker — the client ships the decryption code, so anyone who reads it (or sets a breakpoint) can unwrap the same traffic. See [`ARCHITECTURE.md § Design Trade-offs & Honest Limitations`](./ARCHITECTURE.md#-design-trade-offs--honest-limitations) for what this actually defends against.
* **In-Transit Payload Encryption** — request/response bodies are encrypted with **AES-256-GCM** (via the browser's native WebCrypto API) with 32–96 bytes of random noise padding to reduce ciphertext-length side-channel leakage.
* **Ephemeral Key Agreement (ECDH P-256 + HKDF)** — client and server negotiate ephemeral session keys in volatile RAM; no static encryption keys are stored on disk or hardcoded in client bundles.
* **Anti-Replay & Anti-Tamper Guard** — atomic nonces and 60-second timestamp windows enforced via **HMAC-SHA256** signatures (`x-shield-sig`, `x-shield-nonce`, `x-shield-timestamp`). Replays are rejected with `403 Forbidden`. This is the one property TLS alone doesn't give you for free at the application layer, and it's real regardless of how you feel about the rest of Shield.
* **Field-Level Database Encryption at Rest** — sensitive chat messages, task comments, and 2FA credentials in PostgreSQL are encrypted via Prisma Client `$extends` extensions before disk write.
* **Workspace Roles & Matrix** — pre-configured permission scopes for Owner, Admin, Manager, and Member.
* **2FA Security** — email-based 6-digit verification code pipeline, code logged to the console in development so you can test without a real inbox. (A previous version of this had a hardcoded bypass code for dev/test convenience — removed after a security audit found it was a needless risk if `NODE_ENV` were ever misconfigured in production.)
* **Cryptographic Audit Trail** — SHA-256 tamper-evident hash chaining across workspace mutations with Owner/Admin entity rollbacks.

> Auth, CSRF, and the full list of what a recent internal security audit found and fixed live in [`SECURITY.md`](./SECURITY.md) — including things that were wrong and got corrected, not just a list of what's implemented.

---

## 🛠️ Tech Stack

### Frontend
* **React 19 & Vite** — fast loading, dynamic route code splitting with `React.lazy()` and virtual DOM manipulation.
* **Tailwind CSS 4** — utility-first styling with zero compile-time overhead.
* **Redux Toolkit** — deterministic client-side global state store with unified `ApiResponse` payload unwrapping.
* **W3C Web Cryptography API** — native browser hardware-accelerated ECDH P-256 key exchange, HKDF-SHA256, AES-256-GCM, and HMAC-SHA256.
* **Socket.io-client** — WebSocket client connection wrapper for real-time canvas, presence, and chat.

### Backend & Event Engine
* **Express 5** — REST API gateway router with synthetic in-memory cloaked dispatch pipeline (`req.app.handle`).
* **Syncro Shield Cryptographic Engine** — application-layer payload encryption with replay prevention via Redis nonces (see honest scope/limits above).
* **Socket.IO Real-Time Engine** — modular WebSocket event handlers for Chat, Whiteboards, Retrospectives, Member Presence, and Emoji Reactions.
* **Clean Hexagonal Architecture** — strict layer separation with `AppError` Operational Error hierarchy, `asyncHandler` controller isolation, and unified `ApiResponse` schema.
* **Prisma ORM ($extends)** — type-safe PostgreSQL ORM configured with client extensions (`$extends`) supporting transparent field-level AES-256-GCM encryption at rest, soft-delete query interceptors, and slow query telemetry.
* **DB Service (`dbService.js`)** — transaction engine with exponential backoff retries for transient deadlocks (`40001`/`40P01`), low-overhead database health diagnostic probe (`SELECT 1`), and L2 Redis read-through caching.
* **Request Correlation & Structured Logger** — `x-request-id` header tracking for distributed transaction tracing paired with a high-performance structured JSON telemetry logger.
* **PostgreSQL (Neon)** — serverless relational database engine with composite multi-column indexing.
* **Upstash Redis** — REST-based Redis client for caching and environment-aware rate limiting (`authLimiter`, `apiLimiter`).
* **Inngest** — distributed background serverless queues and event crons categorized by domain.
* **Nodemailer** — SMTP transactional email transporter.

### Testing & Verification

Current, real numbers as of 2026-09-20 (re-run before you trust them further out than that — see CI badge above for what's actually gated on every push):

* **Server unit tests** (`npm run test:unit`, mocked Prisma/Redis, `server/tests/*.test.js` via Vitest) — **60/60 passing**.
* **Client unit tests** (`npm run test`, Vitest + React Testing Library) — **21/21 passing**.
* **Server integration/domain suite** (`node tests/runAllTests.js`, orchestrates 8 suites — mostly logic simulation and mocked infra, not a live DB; see [`SECURITY.md`](./SECURITY.md) for which suites touch a real database) — **207/209 assertions passing across 7/8 suites**. The one failing suite is `gatekeeper.test.js` (2 of 13 assertions), a known Redis-cache-timing flake in a suite that queries a live database directly rather than a mock — not currently gated in CI for that reason (see CI workflow comments and `SECURITY.md` for the isolation gap this reflects).
* **Playwright specs** (`e2e/*.spec.js`) exist for auth, chat, tasks, whiteboard, and workspace flows, but `@playwright/test` isn't currently a declared dependency and these aren't wired into any npm script or CI job — treat them as scaffolding for a flow you'd want covered, not as a suite that's verified passing right now.

---

## 📐 Architecture

```mermaid
graph TD
    subgraph Client ["Client: React 19 + Dynamic Code Splitting + Shield Engine"]
        UI["React Lazy UI Pages"] <--> Redux["Redux Toolkit Store"]
        UI <--> SocketClient["Socket.IO Client Engine"]
        UI <--> ShieldClient["Shield Client Engine (WebCrypto ECDH P-256)"]
        ShieldClient <-->|"Encrypted POST (AES-256-GCM + Noise Jitter)"| CloakedWire["Cloaked Wire Envelope"]
    end

    subgraph Server ["Backend Gateway: Express 5 + Syncro Shield Engine"]
        CloakedWire --> ShieldRouter["POST /api/v2/shield/dispatch"]
        ShieldRouter --> ReplayGuard["Replay & HMAC Signature Guard"]
        ReplayGuard --> DecryptEngine["AES-256-GCM Decryption Engine"]
        DecryptEngine --> SyntheticDispatch["In-Memory Dispatch (req.app.handle in 0ms)"]
        
        SyntheticDispatch --> RESTControllers["Internal Controllers & Auth (protect)"]
        RESTControllers <--> EventBus["Internal EventBus Service"]
        RESTControllers <--> CacheLayer["Redis Caching Layer"]
        RESTControllers <--> Prisma["Prisma ORM ($extends Field Encryption)"]
        
        Sockets["Socket.IO Engine"] <--> Handlers["Socket Event Handlers"]
        Handlers --- MsgH["Message & Reaction Handlers"]
        Handlers --- WbH["Whiteboard Canvas Handler"]
        Handlers --- PresH["Presence Handler"]
        Handlers --- RetroH["Retro Board Handler"]
    end

    subgraph Infrastructure ["Data & Services"]
        CacheLayer <-->|"Upstash REST"| Redis[("Upstash Redis Cache")]
        Prisma <-->|"Encrypted PostgreSQL Connection"| DB[("Neon Serverless Database (AES-256 Encrypted At Rest)")]
        EventBus <-->|"Event Triggers"| Inngest["Inngest Background Workers"]
        Inngest --- InngestCore["Core / Auth / Member Jobs"]
        Inngest --- InngestTasks["Task Lifecycle & Recurrence Jobs"]
        Inngest --- InngestProjects["Project / Sprint / Epic / Retro Jobs"]
        Inngest --- InngestCollab["Chat / Whiteboard / Meeting Jobs"]
        RESTControllers <-->|"SMTP Transport"| Nodemailer["Email Service"]
        RESTControllers <-->|"OAuth 2.0 Auth"| Google["Google Calendar API"]
    end

    SocketClient <-->|"WebSocket Real-time Sync"| Sockets
```

---

## 📂 Folder Structure

```text
Syncro/
├── client/                             # React 19 Client SPA (Vite + React.lazy Route Code-Splitting)
│   ├── public/                         # Static assets & PWA service worker
│   │   └── service-worker.js           # PWA caching interceptor (GET API requests, production-scoped)
│   ├── src/
│   │   ├── app/                        # Redux store configurations
│   │   ├── components/                 # Presentational UI components (chat, whiteboard, scrum, audit)
│   │   ├── configs/                    # Axios API configuration & transparent Shield interceptors
│   │   ├── context/                    # React Contexts (AuthContext, SocketContext)
│   │   ├── features/                   # Redux Toolkit slices (workspace, theme)
│   │   ├── hooks/                      # Custom React hooks (chat, settings, profile)
│   │   ├── pages/                      # Dynamically imported route shells (Dashboard, Chat, Whiteboard, etc.)
│   │   ├── utils/                      # Shield WebCrypto (ECDH, AES-256-GCM, HMAC), sessions & permissions
│   │   │   ├── shieldCrypto.js         # Client-side WebCrypto ECDH P-256, AES-256-GCM, HKDF, HMAC
│   │   │   └── shieldSession.js        # Session key lifecycle, atomic nonces, handshake management
│   │   ├── main.jsx                    # SPA entry point & conditional SW registration
│   │   └── index.css                   # Global Tailwind CSS 4 styles
│   ├── .env.example                    # Client environment template
│   └── vite.config.js                  # Vite bundler configuration
├── server/                             # Express 5 REST API Gateway & Real-Time Engine
│   ├── config/                         # Prisma with AES-256-GCM field encryption, Redis & Nodemailer
│   ├── controllers/                    # Domain REST controllers (auth, chat, task, sprint, retro, etc.)
│   ├── inngest/                        # Inngest background event handlers (collab, core, projects, tasks)
│   ├── middlewares/                    # JWT Auth, Rate Limiter, Anti-Replay Guard & Security Headers
│   ├── prisma/                         # Prisma relational schema configuration
│   ├── routes/                         # Express router maps (19 domain routes + Shield Gateway)
│   │   └── shieldRoutes.js             # /api/v2/shield (handshake & synthetic cloaked dispatch)
│   ├── services/                       # AuditLogger, EventBus, Google Calendar & Shield Engine
│   │   └── shieldEngine.js             # Node crypto ECDH, AES-256-GCM, HKDF, anti-replay nonce store
│   ├── socket/                         # Socket.IO handlers (message, whiteboard, presence, retro, reaction)
│   ├── tests/                          # 8 Vitest & automated database test suites
│   │   ├── shield.test.js              # Cryptographic primitive & synthetic pipeline unit tests
│   │   └── shieldE2E.test.js           # End-to-end handshake, dispatch, & anti-replay verification
│   └── server.js                       # Express application & Socket.IO server boot script
├── e2e/                                # Playwright E2E collaborative test suites
│   ├── auth.spec.js
│   ├── chat.spec.js
│   ├── tasks.spec.js
│   ├── whiteboard.spec.js
│   └── workspace.spec.js
├── docs/                               # Screenshots and walkthrough documentation
└── playwright.config.js                # Playwright test suite setup
```

---

## 🗄️ Database Schema

```mermaid
erDiagram
    User ||--o{ WorkspaceMember : memberOf
    Workspace ||--o{ WorkspaceMember : contains
    Workspace ||--o{ Project : hosts
    Workspace ||--o{ SubTeam : organizes
    Project ||--o{ Task : contains
    Project ||--o{ Sprint : schedules
    Project ||--o{ Epic : categorizes
    Sprint ||--o{ RetroColumn : includes
    RetroColumn ||--o{ RetroItem : contains
    Channel ||--o{ Message : records
    Message ||--o{ MessageReaction : receives
    Workspace ||--o{ Channel : contains
    User ||--o{ Message : sends
    User ||--o{ Notification : receives
```

* **User** — authentication credentials, 2FA codes, verification timestamps, and Google Calendar OAuth tokens.
* **Workspace & WorkspaceMember** — organization scoping; `WorkspaceMember` links users with custom role permissions.
* **SubTeam & SubTeamMember** — granular sub-team groupings within projects and workspaces.
* **Project & Stage** — hosts project metadata, custom status stages, task trees, and whiteboards.
* **Sprint, Epic, & SprintCapacity** — Agile Scrum planning, capacity allocations, and epic groupings.
* **RetroColumn & RetroItem** — sprint retrospective cards and real-time community upvotes.
* **Task & Comment** — task cards with priority, type, due dates, blocking dependencies, recurrence rules, and comment threads.
* **Channel, Message, & MessageReaction** — channel-based chat, direct messages, message threads, pinned posts, and emoji reactions.
* **Meeting & MeetingInvite** — calendar event scheduling with status tracking and Google Calendar sync.
* **Milestone & Portfolio** — project portfolios and deadline milestones.
* **Notification** — user inbox alert feeds with versioned caching.
* **AuditLog** — complete audit trail of workspace mutations and entity rollbacks.

---

## 🔌 API Design

### Shield Cloaked Gateway (application-layer payload encryption — not endpoint secrecy; see [`ARCHITECTURE.md`](./ARCHITECTURE.md#-design-trade-offs--honest-limitations))
* `POST /api/v2/shield/handshake` — Ephemeral ECDH P-256 key exchange establishing an authenticated AES-256-GCM session key derived via HKDF-SHA256 with 24-hour expiration.
* `POST /api/v2/shield/dispatch` — Unified cloaked ingress gateway. Unpacks `{ iv, tag, ciphertext }`, enforces atomic anti-replay nonces & timestamps, verifies cryptographic HMAC signatures, and executes synthetic Express routing internally. The wire format carries no plaintext endpoint names — but the client bundle ships the code to decrypt it, so this raises the bar for a passive observer, not a motivated one.

### Authentication Endpoints
* `POST /api/auth/register` — creates user, hashes password, generates 2FA, and publishes `app/auth.registered`.
* `POST /api/auth/login` — verifies password, updates 2FA verification code, and triggers `app/auth.login_code_requested`.
* `POST /api/auth/verify-login` — validates the 6-digit verification code, issues a signed JWT, and returns the user profile.

### Workspace Endpoints
* `GET /api/workspaces` — returns workspace list (cached in Redis, 10s TTL, optimized task attributes).
* `POST /api/workspaces` — creates a workspace and invalidates user workspace caches.
* `PUT /api/workspaces/:id/members/:memberId` — updates a member's role and invalidates the role cache.

### Messaging Endpoints
* `GET /api/chat/channels/:channelId/messages` — returns channel message log (cached in Redis, 300s TTL).
* `POST /api/chat/messages` — sends a message and triggers a socket broadcast.

### Inbox Endpoints
* `GET /api/inbox` — returns notifications (cached in Redis with generational versioning, 10s TTL).
* `PUT /api/inbox/:id/read` — toggles read state and increments `inbox:version:${userId}` in Redis.
* `DELETE /api/inbox/:id/archive` — archives a notification and increments `inbox:version:${userId}` in Redis.

---

## 🔄 System Flows

### 1. User Login & 2FA Flow
```text
User → POST /api/auth/login → Generate Code → Publish app/auth.login_code_requested
                                                      │
User ← Return Verification Screen ← Nodemailer SMTP Send Code (or dev code 123456)
  │
  └→ POST /api/auth/verify-login → Check TTL → Sign JWT → Login OK → Clear Auth State & Redirect
```

### 2. Task Completion & Notification Flow
```text
User → PUT /api/tasks/:id (Done) → Publish Inngest Task Update Event
                                                │
User ← Refresh Client UI ← Create Notification ← Audit Log & Sync Google Calendar
```

---

## ⚙️ Installation

1. **Clone & Setup Server**:
   ```bash
   cd server
   npm install
   npx prisma generate
   npx prisma db push
   ```

2. **Setup Client**:
   ```bash
   cd ../client
   npm install
   ```

---

## 🔑 Environment Variables

### Client `.env` (`client/.env`):
```bash
VITE_BASE_URL=http://localhost:5001
VITE_SERVER_URL=http://localhost:5001
VITE_API_URL=http://localhost:5001
```

### Server `.env` (`server/.env`):
```bash
PORT=5001
DATABASE_URL="postgresql://user:pass@ep-fancy-union.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:pass@ep-fancy-union.neon.tech/neondb?sslmode=require"
JWT_SECRET="your_custom_jwt_secret_key"
CLIENT_URL="http://localhost:5173"
UPSTASH_REDIS_REST_URL="https://your-database.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_upstash_redis_rest_token"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USERNAME="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

---

## 💻 Running Locally

### Start Backend Gateway & Socket Server:
```bash
cd server
npm start        # or npm run server (nodemon)
```

### Start Vite Frontend:
```bash
cd client
npm run dev
```

### Run Tests:
```bash
cd server
npm run db:test     # Automated database & health test suite
npx vitest run      # Unit/integration test suite
npx playwright test # End-to-end browser test suite
```
