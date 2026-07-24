# Syncro Project Directory & Architecture Structure

This document outlines the production-grade directory structure, module layout, and strict engineering constraints established for both the client (`client/`) and server (`server/`) environments of the **Syncro** application.

---

## 📏 Production Modularity Constraints

1. **Max 130 Lines of Code (LOC) per file**: Every component, controller, service, and helper is decomposed into focused, single-responsibility files.
2. **Max 6 Files per directory**: Every directory is strictly capped at 6 files maximum.

---

## 📂 Client Architecture (`client/`)

The client is a React 19 application built with Vite, Vanilla CSS / Tailwind 4, and Redux Toolkit. All imports use absolute path resolution prefixed with `@/` relative to the `src/` directory.

```text
client/
├── src/
│   ├── components/            # Focused presentational components (Max 6 files per folder)
│   │   ├── audit/             # Audit Log Dashboard, Header, Table, Diff Modal, Metrics, Timelines
│   │   ├── auth/              # LoginForm, MfaVerifyForm, RequireAuth
│   │   ├── chat/              # Chat message rendering, dialogs, and member panels
│   │   ├── dashboard/         # Activity feed, stats grid, and progress charts
│   │   ├── inbox/             # Universal Inbox View, Header, List, Item Card, Quick Actions
│   │   ├── layout/            # Sidebar, Navbar, and layout shells
│   │   ├── ownerAudit/        # Owner Security Command Center, Purge Modal, Rollback Center, Exports
│   │   ├── portfolio/         # Portfolio Card, Create Portfolio Modal, Add Project Modal
│   │   ├── project/           # Focused project components
│   │   │   ├── analytics/     # Metrics distribution charts
│   │   │   ├── calendar/      # Calendars and task timelines
│   │   │   ├── dialogs/       # Project creation and member modals
│   │   │   ├── gantt/         # Project Gantt chart view
│   │   │   ├── kanban/        # Columns and cards for kanban
│   │   │   ├── milestones/    # Project Milestones list, cards, headers, and task pickers
│   │   │   ├── overview/      # Cards, sidebars, and statistics summaries
│   │   │   └── tasks/         # Filters and table/list views for project tasks
│   │   ├── roles/             # Role Portal View, Header, Matrix Table, Members List, Presets, Custom Role Modal
│   │   ├── settings/          # Profile, password, and workspace delete forms
│   │   ├── task/              # CreateTask, priorities, and recurrence settings
│   │   └── workspace/         # Invite lists, dropdowns, and team statistics grids
│   ├── pages/                 # Page orchestrators (Max 6 files per folder)
│   │   ├── audit/             # AuditLogs page container
│   │   ├── auth/              # Auth page orchestrator
│   │   ├── calendar/          # SmartCalendar page container
│   │   ├── chat/              # Chat page orchestrator
│   │   ├── dashboard/         # Dashboard page orchestrator
│   │   ├── inbox/             # Inbox page container
│   │   ├── landing/           # Landing page container
│   │   ├── layout/            # Root layout shell
│   │   ├── ownerAudit/        # OwnerAuditControl page container (Strict Owner Only)
│   │   ├── portfolio/         # Portfolios grid and PortfolioDetails views
│   │   ├── project/           # Projects and ProjectDetails views
│   │   ├── roles/             # RolePortal page container
│   │   ├── settings/          # Settings page container
│   │   ├── task/              # TaskDetails page container
│   │   └── workspace/         # Team workspace view and invitation accept page
│   ├── features/              # Redux slices (workspaceSlice, themeSlice, workspaceHelpers)
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
├── controllers/               # Route controllers (Max 6 files per sub-folder)
│   ├── audit/                 # getAuditLogs, getEntityHistory, rollbackEntity, deleteAuditLogs, auditController
│   ├── auth/                  # register, login, MFA verify, and profile updates
│   ├── chat/                  # channelsCrud, membership, archive, and message logs
│   ├── googleCalendar/        # OAuth integration, syncEvents, and status
│   ├── inbox/                 # getInbox, markRead, archiveItem, inboxAction, inboxController
│   ├── milestone/             # createMilestone, getMilestones, updateMilestone, deleteMilestone, linkTasks
│   ├── portfolio/             # createPortfolio, getPortfolios, getPortfolioDetails, updatePortfolio, deletePortfolio
│   ├── project/               # projectCreate, updates, and stages configuration
│   ├── role/                  # getRoleMatrix, updateRoleMatrix, updateMemberRole, manageCustomRole, checkPermissionHelper
│   ├── task/                  # taskCreate, taskUpdate, and taskRecurrence cron triggers
│   ├── workspace/             # workspaceCreate, updates, role manage, and invites flow
│   ├── auditController.js      # Audit domain barrel exporter file
│   ├── authController.js      # Auth domain barrel exporter file
│   ├── chatController.js      # Chat domain barrel exporter file
│   ├── commentController.js   # Task comments CRUD controllers
│   ├── milestoneController.js # Milestone domain barrel exporter file
│   ├── portfolioController.js # Portfolio domain barrel exporter file
│   ├── projectController.js   # Project domain barrel exporter file
│   ├── roleController.js      # Role domain barrel exporter file
│   ├── taskController.js      # Task domain barrel exporter file
│   └── workspaceController.js # Workspace domain barrel exporter file
├── routes/                    # Express routing files
│   ├── auditRoutes.js         # /api/audit routes
│   ├── authRoutes.js          # /api/auth routes
│   ├── chatRoutes.js          # /api/chat routes
│   ├── commentRoutes.js       # /api/comments routes
│   ├── googleCalendarRoutes.js # /api/google-calendar routes
│   ├── inboxRoutes.js         # /api/inbox routes
│   ├── milestoneRoutes.js     # /api/milestones routes
│   ├── portfolioRoutes.js     # /api/portfolios routes
│   ├── projectRoutes.js       # /api/projects routes
│   ├── roleRoutes.js          # /api/roles routes
│   ├── taskRoutes.js          # /api/tasks routes
│   └── workspaceRoutes.js     # /api/workspaces routes
├── services/                  # Business logic services
│   └── auditLogger.js         # Centralized audit logging service
├── middlewares/               # Express auth middlewares
│   └── authMiddleware.js      # JWT authentication middleware
├── config/                    # Global database connection/email configuration
│   ├── nodemailer.js          # SMTP transporter setup
│   └── prisma.js              # Prisma Client singleton setup
├── inngest/                   # Background event listener and cron scheduler
│   └── index.js               # Inngest client configuration and functions
├── prisma/                    # Schema design & database migration history
│   └── schema.prisma          # Database models definition schema (AuditLog, Portfolio, Milestone, Notification, etc.)
├── server.js                  # Express API boot entrypoint
└── vercel.json                # Serverless deployment configuration
```
