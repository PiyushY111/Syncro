# 🚀 Syncro: Premium Project & Team Collaboration Workspace

Syncro is a premium, high-performance, and developer-centric team collaboration platform designed for modern product squads, engineering organizations, and high-velocity teams. It merges real-time collaborative canvas boards, a rich Slack-like communication ecosystem, automated background pipelines, granular security command centers, and two-factor authentication into a unified workspace.

---

## 📐 System Architecture

Syncro's design isolates data boundaries between workspace organizations, utilizing a lightweight, event-driven background job model and WebSockets for real-time state synchronization.

```mermaid
graph TD
    Client[React 19 + Vite Frontend] <-->|REST API / WebSockets| Server[Express.js API Gateway]
    Server <-->|Prisma ORM| DB[(PostgreSQL Database)]
    Server <-->|Transactional SMTP| Email[Nodemailer Service]
    Server <-->|Event Worker & Cron| Inngest[Inngest Background Queue]
    Server <-->|OAuth 2.0 Auth & Sync| Google[Google Calendar API]
```

---

## ✨ Features & Capabilities

### 🎨 Live Collaborative Whiteboards
* **Vector Canvas**: A real-time whiteboard canvas allowing teams to draft plans, map workflows, and design architectures.
* **Nodes & Edges**: Drag-and-drop creation of sticky notes, text labels, and task nodes with dynamic connecting arrows.
* **Real-time Cursor Broadcasting**: Track workspace members' mouse positions on the canvas using low-latency WebSocket events.
* **Multi-page Layouts**: Organically split your whiteboards into multiple pages and easily switch between them.
* **Creator-led Board Sharing**: Share whiteboards securely with team members via email invitations. Only the original creator retains sharing authority.
* **SVG Export Engine**: Export your entire whiteboard workspace directly into clean SVG vectors with a single click.

### 💬 Rich Messaging Ecosystem
* **Multi-channel Directories**: Spin up public channels for general collaboration or restrict visibility to select members with invite-only private channels.
* **Direct Messaging (DMs)**: Chat one-on-one with clean, searchable user directories.
* **Threaded Context Panels**: Prevent main channel clutter by starting threaded discussions that slide open in a dedicated side-panel.
* **Message Pinning & Starring**: Keep track of high-priority discussions or star messages for quick personal reference.
* **Channel Search Engine**: Find public channels in the workspace and join them dynamically via an intuitive confirmation popup.
* **Live Member Index**: Inspect real-time participant status in any channel, complete with creator and owner highlight badges.

### 📁 Advanced Task & Project Pipelines
* **Task Dependency Visualizer**: Track blocking dependencies between tasks, identifying bottleneck activities in real-time.
* **Kanban Grid Boards**: Manage tasks across stages (e.g. TODO, IN_PROGRESS, DONE) using drag-and-drop boards.
* **Interactive Gantt Timelines**: Schedule tasks over clear calendar schedules and visual timeline charts.
* **Milestone Tracking**: Categorize tasks under milestones with dedicated status metrics (Planned, In Progress, Achieved, Missed, Cancelled).
* **Recurring Tasks Engine**: Set task recurrence patterns (Daily, Weekly, Monthly) triggered automatically by a server-side background cron scheduler.
* **Multi-Dimensional Task Categorization**: Classify tasks by type (Task, Bug, Feature, Improvement, Other) and assign custom priorities (Low, Medium, High).

### 🛡️ Granular Roles & Security Command Center
* **Workspace Permissions Matrix**: Configure actions dynamically across default role presets: Owner, Admin, Manager, and Member.
* **Custom Roles Generator**: Create custom roles to fit complex team hierarchies with specific read/write access settings.
* **Entity History Audit Logs**: Keep a permanent record of all workspace modifications (Create, Update, Delete, Rollback, Login, and Role Change).
* **Rollback Center**: Undo accidental changes and restore previous versions of database entities directly from the audit panel.
* **Owner-Only Purge Control**: High-privileged command center allowing workspace owners to safely delete historical logs.

### 🔔 Unified Inbox & Notification Hub
* **Smart Alert Categories**: Receive instantly routed notifications filtered by type (Task Assignment, Due Alert, Comment Mentions, Chat Messages, Meeting Invites, and Milestone Alerts).
* **Redirection Engine**: Click any inbox notification to automatically navigate directly to the relevant task, channel, or calendar event.
* **Status Controls**: Mark notifications as read/unread or archive them for clean workspace organization.

### 📅 Smart Meetings & Google Calendar Sync
* **Interactive Scheduling**: Create meetings with title, agenda, location, and video conference links.
* **Bi-directional Google OAuth Sync**: Seamlessly sync meetings and task due dates with external Google Calendars using Google OAuth 2.0.
* **Webhook Listeners**: Receive push updates from Google Calendar API to ensure double-sided schedule integrity.

### 🔑 Custom Email-based 2FA Logins
* **Zero External Auth Dependencies**: Built natively using Node.js cryptography, JWT sessions, and Bcrypt password hashing.
* **Secure 6-Digit Verification**: Dispatches verification codes using beautifully designed email templates.
* **Secure Input Filters**: Form layouts fitted with character autofills, automated resend timers, and fallback redirect modes.

---

## 🛠️ Technology Stack

### Frontend Architecture
* **React 19** & **Vite** — Declarative UI rendering & fast HMR.
* **Tailwind CSS 4** — Zero-runtime modern styling.
* **Redux Toolkit** — Deterministic global state management.
* **React Router v7** — Client-side route scheduling.
* **Socket.io-client** — WebSocket-based real-time event sync.
* **Lucide React** — Premium iconography.
* **React Hot Toast** — Non-blocking push notices.

### Backend Infrastructure
* **Express.js (v5)** — REST API gateway.
* **Prisma ORM** — Type-safe client data modeling.
* **PostgreSQL (Neon.tech)** — Distributed, serverless relational database.
* **Inngest** — Asynchronous event queueing & cron scheduling.
* **Nodemailer** — SMTP email transmission.
* **Bcrypt.js** — Secure password encryption.
* **Jsonwebtoken** — Session token verification.

---

## ⚙️ Environment Configuration

Set up local `.env` files in both directories to configure database connectivity, OAuth hooks, and transactional email transporters.

### 💻 Client Config (`client/.env`)
```bash
# Gateway Base URL
VITE_BASE_URL=http://localhost:5001
```

### 🎛️ Server Config (`server/.env`)
```bash
# Express Server Port
PORT=5001

# Neon PostgreSQL Connection URLs
DATABASE_URL=postgresql://neondb_owner:...@ep-fancy-union-awmvsy6x-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://neondb_owner:...@ep-fancy-union-awmvsy6x-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require

# JWT Cryptographic Secret Key
JWT_SECRET=your_jwt_signing_secret_here

# Allowed CORS client hosts (comma-separated list)
CLIENT_URL=http://localhost:5173,https://syncro-amber.vercel.app

# Nodemailer SMTP Credentials
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_gmail_address@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=Syncro <syncro@yourdomain.com>

# Security Token Expirations
INVITE_TTL_MS=604800000

# Google OAuth API Settings (For Calendar sync)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5001/api/google-calendar/callback
```

---

## 🚀 Getting Started

Ensure you have [Node.js](https://nodejs.org) and [PostgreSQL](https://postgresql.org) ready.

### 1. Database Setup
Instantiate the schema bindings and run Prisma migrations:
```bash
cd server
npm install
npx prisma db push
```

### 2. Launch Server Gateway
Boot the Express API server and Inngest client worker:
```bash
npm run dev
```

### 3. Launch Client Web App
Initialize packages and run Vite's development bundler:
```bash
cd ../client
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

> [!TIP]
> Ensure both ports `5001` (backend) and `5173` (frontend) are unrestricted on your localhost firewall to allow smooth API communications and Socket connections.

> [!WARNING]
> Google OAuth redirect domains MUST exactly match the `GOOGLE_REDIRECT_URI` configured in your backend `.env` file to prevent auth-state mismatches.
