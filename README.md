# 🚀 Syncro: Collaborative Team Workspace

```text
  ██████  ██    ██ ███    ██  ██████ ██████   ██████  
 ██       ██    ██ ████   ██ ██      ██   ██ ██    ██ 
  █████   ██    ██ ██ ██  ██ ██      ██████  ██    ██ 
       ██  ██  ██  ██  ██ ██ ██      ██   ██ ██    ██ 
  ██████    ████   ██   ████  ██████ ██   ██  ██████  
                                                      
   A DEVELOPER-CENTRIC TEAM COLLABORATION HUB
```

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

### 5. Performance: Caching & PWA Support
* **Redis Caching** — workspace lists, role checks, and notification inbox feeds are cached in Redis.
* **Service Worker** — a custom client-side Service Worker intercepts static assets and `/api/*` REST payloads, offering read-only offline fallback support.

### 6. Security & Permissions
* **Workspace Roles & Matrix** — pre-configured permission scopes for Owner, Admin, Manager, and Member.
* **Entity Rollbacks & Audits** — an audit log records every create, edit, and delete action. Rollback to a previous record state is restricted to Owner and Admin roles, is itself logged as an audit event, and requires the acting user to have active membership in the target workspace at the time of the action.

---

## 🛠️ Tech Stack

### Frontend
* **React 19 & Vite** — fast loading and lightweight virtual DOM manipulation.
* **Tailwind CSS 4** — utility-first styling with zero compile-time overhead.
* **Redux Toolkit** — deterministic client-side global state store.
* **Socket.io-client** — WebSocket client connection wrapper for real-time canvas, presence, and chat.

### Backend, Event Engine & Enterprise Infrastructure
* **Express 5** — REST API gateway router.
* **Socket.IO Real-Time Engine** — modular WebSocket event handlers for Chat, Whiteboards, Retrospectives, Member Presence, and Emoji Reactions.
* **Clean Hexagonal Architecture** — strict layer separation with `AppError` Operational Error hierarchy (`BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `ValidationError`), `asyncHandler` controller isolation, and unified `ApiResponse` schema (`{ success, data, message }` / `{ success, error }`).
* **Prisma ORM ($extends)** — type-safe PostgreSQL ORM configured with client extensions (`$extends`) for transparent soft-delete query interceptors (`deletedAt: null`), query telemetry tracking, and slow query alerts (>150ms).
* **Enterprise DB Service (`dbService.js`)** — transaction engine with exponential backoff retries for transient deadlocks (`40001`/`40P01`), low-overhead database health diagnostic probe (`SELECT 1`), and L2 Redis read-through caching.
* **Request Correlation & Structured Logger** — `x-request-id` header tracking for distributed transaction tracing paired with a high-performance structured JSON telemetry logger.
* **PostgreSQL (Neon)** — serverless relational database engine with composite multi-column indexing.
* **Upstash Redis** — REST-based Redis client for caching and rate limiting.
* **Inngest** — distributed background serverless queues and event crons categorized by domain (Core, Tasks, Projects, Collab).
* **Nodemailer** — SMTP transactional email transporter.

### Testing & Verification
* **Enterprise Architecture Test Suite (`tests/architecture.test.js`)** — automated test suite validating AppError hierarchy, ApiResponse schemas, asyncHandler, and DTO validators (15 passed tests).
* **Database Infrastructure Test Suite (`tests/database.test.js`)** — automated test suite verifying DB connection health probes, transaction retries, soft-delete rules, and L2 cache logic (7 passed tests).
* **Vitest** — API unit and integration test runner.
* **Playwright** — End-to-end multi-browser user flow testing suite.

---

## 📐 Architecture

```mermaid
graph TD
    subgraph Client [Client: React 19 + Service Worker Cache]
        UI[React UI Components] <--> Redux[Redux Toolkit Store]
        UI <--> SocketClient[Socket.IO Client]
        UI <--> SW[Custom Service Worker]
        SW <-->|Cache Storage API| Cache[API & Asset Cache]
    end

    subgraph Server [Backend Gateway: Express 5 + Socket.IO Server]
        API[Express 5 REST Gateway] <--> EventBus[Internal EventBus Service]
        API <--> CacheLayer[Redis Caching Layer]
        API <--> Prisma[Prisma ORM]
        
        Sockets[Socket.IO Engine] <--> Handlers[Socket Event Handlers]
        Handlers --- MsgH[Message & Reaction Handlers]
        Handlers --- WbH[Whiteboard Canvas Handler]
        Handlers --- PresH[Presence Handler]
        Handlers --- RetroH[Retro Board Handler]
    end

    subgraph Infrastructure [Data & Services]
        CacheLayer <-->|Upstash REST| Redis[(Upstash Redis Cache)]
        Prisma <-->|PostgreSQL Connection| DB[(Neon Serverless Database)]
        EventBus <-->|Event Triggers| Inngest[Inngest Background Workers]
        Inngest --- InngestCore[Core / Auth / Member Jobs]
        Inngest --- InngestTasks[Task Lifecycle & Recurrence Jobs]
        Inngest --- InngestProjects[Project / Sprint / Epic / Retro Jobs]
        Inngest --- InngestCollab[Chat / Whiteboard / Meeting Jobs]
        API <-->|SMTP Transport| Nodemailer[Email Service]
        API <-->|OAuth 2.0 Auth| Google[Google Calendar API]
    end

    SocketClient <-->|WebSocket Real-time Sync| Sockets
```

---

## 📂 Folder Structure

```text
Syncro/
├── client/                             # React 19 Client SPA
│   ├── public/                         # Static assets & PWA service worker
│   │   └── service-worker.js           # PWA caching interceptor
│   ├── src/
│   │   ├── app/                        # Redux store configurations
│   │   ├── components/                 # Presentational UI components (chat, whiteboard, scrum, audit)
│   │   ├── configs/                    # Axios API configuration & interceptors
│   │   ├── context/                    # React Contexts (AuthContext, SocketContext)
│   │   ├── features/                   # Redux Toolkit slices (workspace, theme)
│   │   ├── hooks/                      # Custom React hooks (chat, settings, profile)
│   │   ├── pages/                      # Page containers & layout shells
│   │   ├── utils/                      # Permission checking & helper utilities
│   │   ├── main.jsx                    # SPA entry point & service worker registration
│   │   └── index.css                   # Global Tailwind CSS 4 styles
│   └── vite.config.js                  # Vite bundler configuration
├── server/                             # Express 5 REST API Gateway & Real-Time Engine
│   ├── config/                         # Prisma, Redis, & Nodemailer SMTP connections
│   ├── controllers/                    # Domain REST controllers (auth, chat, task, sprint, retro, etc.)
│   ├── inngest/                        # Inngest background event handlers (collab, core, projects, tasks)
│   ├── middlewares/                    # JWT Authentication & Project Access Control
│   ├── prisma/                         # Prisma relational schema configuration
│   ├── routes/                         # Express router maps (18 domain routes)
│   ├── services/                       # AuditLogger, EventBus, & Google Calendar services
│   ├── socket/                         # Socket.IO handlers (message, whiteboard, presence, retro, reaction)
│   ├── tests/                          # Vitest API unit/integration tests
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

### Authentication Endpoints
* `POST /api/auth/register` — creates user, hashes password, generates 2FA, and publishes `app/auth.registered`.
* `POST /api/auth/login` — verifies password, updates 2FA verification code, and triggers `app/auth.login_code_requested`.
* `POST /api/auth/verify` — validates the 6-digit verification code, issues a signed JWT, and returns the user profile.

### Workspace Endpoints
* `GET /api/workspaces` — returns workspace list (cached in Redis, 10s TTL).
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
User ← Return Verification Screen ← Nodemailer SMTP Send Code
  │
  └→ POST /api/auth/verify → Check TTL → Sign JWT → Login OK
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

Create a `.env` file in the `server/` directory:
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
npm run dev
```

### Start Vite Frontend:
```bash
cd client
npm run dev
```

### Run Tests:
```bash
cd server
npx vitest run      # Unit/integration test suite
npx playwright test # End-to-end browser test suite
```