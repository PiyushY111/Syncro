# 🚀 Syncro: Premium Collaborative Team Workspace

```text
  ██████  ██    ██ ███    ██  ██████ ██████   ██████  
 ██       ██    ██ ████   ██ ██      ██   ██ ██    ██ 
  █████   ██    ██ ██ ██  ██ ██      ██████  ██    ██ 
       ██  ██  ██  ██  ██ ██ ██      ██   ██ ██    ██ 
  ██████    ████   ██   ████  ██████ ██   ██  ██████  
                                                      
   THE DEVELOPER-CENTRIC TEAM COLLABORATION HUB
```

---

## 📝 Project Description
**Syncro** is a premium, developer-centric, and high-performance team collaboration platform designed for modern product squads, engineering organizations, and high-velocity teams. Syncro merges real-time collaborative whiteboards, a rich Slack-like communication ecosystem, automated background pipelines, granular security command centers, and custom email-based two-factor authentication into a unified, high-speed workspace.

By isolating data boundaries between workspace organizations, using lightweight event-driven background workers (Inngest), and leveraging WebSockets for low-latency state synchronization, Syncro delivers an instantaneous, smooth, and highly responsive user experience.

---

## 🌐 Live Demo & Screenshots
* **Production URL**: [https://syncro.piyushydv.com](https://syncro.piyushydv.com)
* **API Gateway Service**: [https://api.syncro.piyushydv.com](https://api.syncro.piyushydv.com)
* **Screenshots and Walkthroughs**: Visual guides, component layouts, and database state diagrams can be reviewed directly in [walkthrough.md](file:///Users/piyush./.gemini/antigravity/brain/3e562290-c25b-4084-96e3-c3016b55f8a4/walkthrough.md).

---

## ✨ Features

### 1. Live Collaborative Whiteboards
* **Vector Drawing Canvas**: Low-latency coordinate mapping allowing teams to draft plans and system architectures.
* **Sticky Notes & Nodes**: Drag-and-drop sticky notes, connecting arrows, and custom task-node links.
* **Cursor Broadcasting**: Real-time broadcast of member mouse coordinates across browsers via Socket.IO.
* **SVG Vector Export**: Single-click compiler that exports the canvas elements into formatted SVG vector graphics.

### 2. Rich Messaging Directory
* **Public & Private Channels**: Multi-channel directory setups with invite-only membership controls.
* **Direct Messaging (DMs)**: Private 1-on-1 messaging threads with complete workspace member indexing.
* **Threaded Replies & Pins**: Star channels, pin messages, and discuss details in slide-out threaded side panels.

### 3. Task & Project Pipelines
* **Interactive Kanban Board**: Drag-and-drop tasks across stages (TODO, IN_PROGRESS, DONE) with instant socket broadcasts.
* **Gantt Timeline Schedules**: View project tasks, assignees, and milestones across scheduled calendar timelines.
* **Dependency Mapper**: Block tasks or map blocking dependencies, with safety triggers to prevent cyclic dependencies.

### 4. 10/10 Performance Caching & PWAs
* **Redis Caching**: Workspace lists, roles checks, and notification inbox feeds are cached in Redis.
* **Service Worker**: A custom client-side Service Worker intercepts all static assets and `/api/*` REST payloads, offering read-only offline fallback support.

### 5. Granular Security Command Center
* **Workspace Roles & Matrix**: Pre-configured permission scopes for Owner, Admin, Manager, and Member.
* **Entity Rollbacks & Audits**: Audit Log records changes (create, edit, delete). Admins can roll back any database record to previous states.

---

## 🛠️ Tech Stack

### Frontend Architecture
* **React 19 & Vite** — Fast loading and lightweight virtual DOM manipulation.
* **Tailwind CSS 4** — Modern utility-first styling with zero compile-time overhead.
* **Redux Toolkit** — Deterministic client-side global state store.
* **Socket.io-client** — WebSocket client connection wrapper.

### Backend Infrastructure
* **Express 5** — High-speed REST API gateway router.
* **Prisma ORM** — Type-safe PostgreSQL client mapping.
* **PostgreSQL (Neon)** — Serverless relational database engine.
* **Upstash Redis Cache** — High-performance REST-based Redis client.
* **Inngest** — Distributed background serverless queues and event crons.
* **Nodemailer** — Standard SMTP transactional email transporter.

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

* **User**: Handles authentication data, 2FA validation codes, verification expirations, and Google Calendar OAuth tokens.
* **Workspace & WorkspaceMember**: Scopes organizational data. `WorkspaceMember` links users and custom permission roles.
* **Project**: Hosts stages, task trees, sprints, capacities, and epic milestones.
* **Task**: Tracks priorities (High, Medium, Low), types (Bug, Feature, Task), statuses (TODO, IN_PROGRESS, DONE), assignees, due dates, and dependency blocks.
* **Channel & Message**: Handles threaded messaging logs and message reactions.
* **Notification**: smart alerts dispatched to user inbox hubs.
* **AuditLog**: tracks create, edit, delete, rollback, and login events.

---

## 🔌 API Design

### Authentication Endpoints
* `POST /api/auth/register` — Creates user, hashes password, generates 2FA, and publishes `app/auth.registered`.
* `POST /api/auth/login` — Verifies passwords, updates 2FA verification codes, and triggers `app/auth.login_code_requested`.
* `POST /api/auth/verify` — Validates the 6-digit verification code, issues a signed JWT, and returns user profiles.

### Workspace Endpoints
* `GET /api/workspaces` — Returns workspaces list (cached in Redis, 10s TTL).
* `POST /api/workspaces` — Creates a new workspace and invalidates user workspace caches.
* `PUT /api/workspaces/:id/members/:memberId` — Updates user workspace roles and invalidates role cache.

### Messaging Endpoints
* `GET /api/chat/channels/:channelId/messages` — Returns channel message logs (cached in Redis, 300s TTL).
* `POST /api/chat/messages` — Sends message and triggers socket broadcast.

### Inbox Endpoints
* `GET /api/inbox` — Returns notifications (cached in Redis using generational versioning, 10s TTL).
* `PUT /api/inbox/:id/read` — Toggles read states and increments `inbox:version:${userId}` in Redis.
* `DELETE /api/inbox/:id/archive` — Archives notification and increments `inbox:version:${userId}` in Redis.

---

## 🔄 System Flows

### 1. User Login & 2FA Flow
```text
User ➔ POST /api/auth/login ➔ Generate Code ➔ Publish app/auth.login_code_requested
                                                      │
User  Return Verification Screen  NodeMailer SMTP Send Code
  │
  └➔ POST /api/auth/verify ➔ Check TTL ➔ Sign JWT ➔ Login OK
```

### 2. Task Completion & Notification Flow
```text
User ➔ PUT /api/tasks/:id (Done) ➔ Publish Inngest Task Update Event
                                                │
User  Refresh Client UI  Create Notification  Audit Log & Sync Google Calendar
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
npx vitest run     # Runs Unit/Integration test suites
npx playwright test # Runs End-to-End browser test suite
```

