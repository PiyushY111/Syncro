# 🚀 Syncro: Project & Team Collaboration Workspace

Syncro is a premium, modern, full-stack team collaboration and project management platform. It brings together robust project task tracking, detailed team analytics, and a fully featured Slack-like chat ecosystem (with public/private channels, direct messaging, threaded replies, search, and member indexes) protected by custom email-based two-factor authentication (2FA).

---

## ✨ Primary Features

### 💬 Slack-like Messaging Ecosystem
* **Group Channels**: Create public channels (accessible to all members, requiring joining to view message histories) or private channels (only visible to workspace owners, creators, and explicitly invited teammates).
* **Direct Messages (DMs)**: Engage in peer-to-peer conversations with clear list indexes.
* **Threaded Discussions**: Click on any message to open nested thread replies in a sliding side-panel.
* **Public Channel Search**: Click the magnifying glass in the sidebar to search all public channels in the workspace and join them via a confirmation popup.
* **Channel Members Index**: Click the member count in the header to view a searchable list of all users joined to the active channel, highlighted with workspace creator and owner badges.
* **System Logs**: View hand-waving welcome notifications when new users join.
* **Invite Links**: Copy shareable invite links (`/chat?invite=id`) that automatically add members when visited.

### 🏢 Onboarding & Workspace Control
* **Dual Onboarding Flows**: Start instantly with a solo **Personal Space** card or build custom **Team Workspaces**.
* **Isolated Data Boundaries**: Keep your team workspaces separate, with individual member management, project pipelines, and task backlogs.

### 🔑 Secure 6-Digit Email 2FA Logins
* **Zero External Dependencies**: Authentication is powered by custom Node.js, bcrypt password hashes, and JSON Web Tokens (JWT).
* **Two-Factor Login Protection**: Entering credentials dispatches a 6-digit security code to the user's email address via a beautiful Nodemailer email template.
* **Secure UI Entry**: Enter codes through a premium, input-filtered verification layout that supports code resending and returning to sign-in.

### 📁 Project & Task Tracking
* **Detailed Task Board**: Assign priorities, due dates, statuses, and manage task owners.
* **Comments & Activities**: Team discussion threads on individual tasks.
* **Analytics Board**: Track completion rates, task statistics, and overall workspace progress.

---

## 🛠️ Technology Stack

### Frontend
* **React 19** & **Vite**
* **Tailwind CSS 4**
* **Redux Toolkit** (State management)
* **React Router v7**
* **Axios** (API requests)
* **Lucide React** (Modern iconography)
* **React Hot Toast** (Push notifications)

### Backend
* **Express.js** (REST API)
* **Prisma ORM**
* **PostgreSQL** (Neon Database serverless pooler)
* **Inngest** (Background jobs queuing)
* **Nodemailer** (SMTP transactional emails)
* **Bcrypt.js** (Password hashing)
* **Jsonwebtoken** (Session state validation)

---

## ⚙️ Environment Configuration

Set up `.env` files in both the client and server root directories.

### 💻 Client (`client/.env`)
```bash
# Backend endpoint URL
VITE_BASE_URL=http://localhost:5001
```

### 🎛️ Server (`server/.env`)
```bash
# Server port
PORT=5001

# Neon PostgreSQL connection strings
DATABASE_URL=postgresql://neondb_owner:...@ep-fancy-union-awmvsy6x-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://neondb_owner:...@ep-fancy-union-awmvsy6x-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require

# JWT Cryptographic secret
JWT_SECRET=your_jwt_signing_secret_here

# Flexible CORS Client domains (comma-separated list)
CLIENT_URL=https://syncro-amber.vercel.app,http://localhost:5173

# Nodemailer SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_gmail_address@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=Syncro <syncro@yourdomain.com>

# Token Expirations
INVITE_TTL_MS=604800000
```

---

## 🚀 Running Locally

### 1. Database Setup
Push the prisma schema and generate the client bindings:
```bash
cd server
npm install
npx prisma db push
```

### 2. Start the Backend Server
```bash
npm run dev
# or: node server.js
```

### 3. Start the Frontend Client
```bash
cd ../client
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
