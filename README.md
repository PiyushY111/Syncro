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

### 4. Performance: Caching & PWA Support
* **Redis Caching** — workspace lists, role checks, and notification inbox feeds are cached in Redis.
* **Service Worker** — a custom client-side Service Worker intercepts static assets and `/api/*` REST payloads, offering read-only offline fallback support.

### 5. Security & Permissions
* **Workspace Roles & Matrix** — pre-configured permission scopes for Owner, Admin, Manager, and Member.
* **Entity Rollbacks & Audits** — an audit log records every create, edit, and delete action. Rollback to a previous record state is restricted to Owner and Admin roles, is itself logged as an audit event, and requires the acting user to have active membership in the target workspace at the time of the action.

---

## 🛠️ Tech Stack

### Frontend
* **React 19 & Vite** — fast loading and lightweight virtual DOM manipulation.
* **Tailwind CSS 4** — utility-first styling with zero compile-time overhead.
* **Redux Toolkit** — deterministic client-side global state store.
* **Socket.io-client** — WebSocket client connection wrapper.

### Backend
* **Express 5** — REST API gateway router.
* **Prisma ORM** — type-safe PostgreSQL client mapping.
* **PostgreSQL (Neon)** — serverless relational database engine.
* **Upstash Redis** — REST-based Redis client.
* **Inngest** — distributed background serverless queues and event crons.
* **Nodemailer** — SMTP transactional email transporter.

---

## 📐 Architecture

```mermaid
graph TD
    subgraph Client [Client: React 19 + Service Worker Cache]
        UI[React UI Components] <--> Redux[Redux Toolkit Store]
        UI <--> Socket[Socket.IO Client]
        UI <--> SW[Custom Service Worker]
        SW <-->|Cache Storage API| Cache[API & Asset Cache]
    end

    subgraph Server [Backend: Express 5 + Socket.IO]
        API[Express API Gateway] <--> Sockets[Socket.IO Engine]
        API <--> CacheLayer[Redis Caching Layer]
        API <--> Prisma[Prisma ORM]
    end

    subgraph Infrastructure [Data & Services]
        CacheLayer <-->|Upstash REST| Redis[(Upstash Redis Cache)]
        Prisma <-->|PostgreSQL Connection| DB[(Neon Serverless Database)]
        API <-->|Inngest Events| Inngest[Inngest Background Queue]
        API <-->|SMTP Transport| Nodemailer[Email Service]
        API <-->|OAuth 2.0 Auth| Google[Google Calendar API]
    end

    Socket <-->|WebSocket Real-time Sync| Sockets
```

---

## 📂 Folder Structure

```text
Syncro/
├── client/                             # React 19 Client SPA
│   ├── public/                         # Static assets
│   │   └── service-worker.js           # PWA caching interceptor
│   ├── src/
│   │   ├── app/                        # Redux store configs
│   │   ├── components/                 # Presentational components (chat, whiteboard)
│   │   ├── context/                    # React Contexts (Auth, Sockets)
│   │   ├── features/                   # Redux slices
│   │   ├── hooks/                      # Custom hooks
│   │   ├── pages/                      # Page containers
│   │   ├── main.jsx                    # Bootstrapper (SW registration)
│   │   └── index.css                   # Global Tailwind 4 styles
│   └── vite.config.js                  # Vite bundler configs
├── server/                             # Express 5 REST API Gateway
│   ├── config/                         # Prisma, Redis, & SMTP connectors
│   ├── controllers/                    # REST controllers (auth, inbox, chat, task)
│   ├── inngest/                        # Inngest background event handlers
│   ├── middlewares/                    # Authentication and project access checks
│   ├── prisma/                         # Prisma schema model configs
│   ├── routes/                         # Express router maps
│   ├── tests/                          # Vitest API unit/integration tests
│   └── server.js                       # Express boot entry point
├── e2e/                                # Playwright E2E collaborative tests
│   ├── auth.spec.js
│   ├── chat.spec.js
│   └── tasks.spec.js
├── docs/                               # Screenshots and walkthrough docs
└── playwright.config.js                # Playwright E2E configurations
```

---

## 🗄️ Database Schema

```mermaid
erDiagram
    User ||--o{ WorkspaceMember : memberOf
    Workspace ||--o{ WorkspaceMember : contains
    Workspace ||--o{ Project : hosts
    Project ||--o{ Task : contains
    Channel ||--o{ Message : records
    Workspace ||--o{ Channel : contains
    User ||--o{ Message : sends
    User ||--o{ Notification : receives
```

* **User** — authentication data, 2FA validation codes, verification expirations, and Google Calendar OAuth tokens.
* **Workspace & WorkspaceMember** — scopes organizational data; `WorkspaceMember` links users and custom permission roles.
* **Project** — hosts stages, task trees, sprints, capacities, and epic milestones.
* **Task** — tracks priorities (High, Medium, Low), types (Bug, Feature, Task), statuses (TODO, IN_PROGRESS, DONE), assignees, due dates, and dependency blocks.
* **Channel & Message** — handles threaded messaging logs and message reactions.
* **Notification** — alerts dispatched to user inbox hubs.
* **AuditLog** — tracks create, edit, delete, rollback, and login events.

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
