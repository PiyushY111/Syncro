# Syncro Project Directory & Architecture Structure

This document outlines the production-grade directory structure, module layout, and strict engineering constraints established for both the client (`client/`) and server (`server/`) environments of the **Syncro** application.

---

## 📂 Client Architecture (`client/`)

The client is a React 19 application built with Vite, Tailwind 4, and Redux Toolkit. All imports use absolute path resolution prefixed with `@/` relative to the `src/` directory.

```text
client/
├── src/
│   ├── components/            # Focused presentational components
│   │   ├── auth/              # LoginForm, MfaVerifyForm, RequireAuth
│   │   ├── chat/              # Chat message rendering and inputs
│   │   │   ├── dialogs/       # Channel browser, creation, confirmation modals
│   │   │   └── panels/        # Threads stream and workspace member sidebar panels
│   │   ├── dashboard/         # Activity feed, stats grid, and progress charts
│   │   ├── layout/            # Sidebar, Navbar, and no-workspace screen
│   │   ├── project/           # (0 files - organized in sub-folders)
│   │   │   ├── analytics/     # Metrics distribution charts
│   │   │   ├── calendar/      # Calendars and task timelines
│   │   │   ├── dialogs/       # Project creation and members adding
│   │   │   ├── kanban/        # Columns and cards for project kanban
│   │   │   ├── overview/      # Cards, sidebars, and statistics summaries
│   │   │   └── tasks/         # Filters and table/list views for project tasks
│   │   ├── settings/          # Profile, password, and workspace delete forms
│   │   ├── task/              # CreateTask, priorities, and recurrence settings
│   │   └── workspace/         # Invite lists, dropdowns, and statistics grids
│   ├── pages/                 # Routing containers / Page orchestrators
│   │   ├── auth/              # Auth page orchestrator
│   │   ├── chat/              # Chat page orchestrator
│   │   ├── dashboard/         # Dashboard page orchestrator
│   │   ├── layout/            # Root layout shell
│   │   ├── project/           # Projects and ProjectDetails views
│   │   ├── settings/          # Settings page container
│   │   ├── task/              # TaskDetails page container
│   │   └── workspace/         # Team workspace view and invitation accept page
│   ├── features/              # Redux slices (theme, workspace helpers/slices)
│   ├── hooks/                 # Custom React hooks (useChat, useSettings)
│   ├── context/               # Global authentication context providers
│   ├── configs/               # Axios instances and API routes config
│   ├── App.jsx                # Main entry routing wrapper
│   └── main.jsx               # Client initialization entrypoint
├── jsconfig.json              # Absolute paths IDE auto-completion support
└── vite.config.js             # Vite plugin alias resolve configs
```

---

## 📂 Server Architecture (`server/`)

The server is a Node.js Express 5 REST API using Prisma ORM with PostgreSQL, alongside Inngest for distributed background event/cron processing.

```text
server/
├── controllers/               # Route controllers (grouped into domain sub-folders)
│   ├── auth/                  # register, login, MFA verify, and profile updates
│   ├── chat/                  # channelsCrud, membership, archive, and message logs
│   ├── project/               # projectCreate, updates, and stages configuration
│   ├── task/                  # taskCreate, taskUpdate, and taskRecurrence cron triggers
│   ├── workspace/             # workspaceCreate, updates, role manage, and invites flow
│   ├── authController.js      # Auth domain barrel exporter file
│   ├── chatController.js      # Chat domain barrel exporter file
│   ├── commentController.js   # Task comments CRUD controllers
│   ├── projectController.js   # Project domain barrel exporter file
│   ├── taskController.js      # Task domain barrel exporter file
│   └── workspaceController.js # Workspace domain barrel exporter file
├── routes/                    # Express routing files
│   ├── authRoutes.js
│   ├── chatRoutes.js
│   ├── commentRoutes.js
│   ├── projectRoutes.js
│   ├── taskRoutes.js
│   └── workspaceRoutes.js
├── middlewares/               # Express auth middlewares
│   └── authMiddleware.js
├── config/                    # Global database connection/email configuration
│   ├── nodemailer.js          # SMTP transporter setup
│   └── prisma.js              # Prisma Client singleton setup
├── inngest/                   # Background event listener and cron scheduler
│   └── index.js               # Inngest client client configuration and functions
├── prisma/                    # Schema design & database migration history
│   └── schema.prisma          # Database models definition schema
├── server.js                  # Express API boot entrypoint
└── vercel.json                # Serverless deployment configuration
```
