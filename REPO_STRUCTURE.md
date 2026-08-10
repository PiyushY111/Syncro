# Syncro Project Directory & Architecture Structure

This document outlines the production-grade directory structure, module layout, and architecture for both the client (`client/`) and server (`server/`) environments of the **Syncro** application.

---

## 📂 Client Architecture (`client/`)

The client is a React 19 application built with Vite, Tailwind CSS 4, and Redux Toolkit. All imports use absolute path resolution prefixed with `@/` relative to the `src/` directory.

```text
client/
├── src/
│   ├── app/                   # Redux store configurations
│   │   └── store.js           # Global Redux store definition & slice reducer root
│   ├── assets/                # Static assets (images, logos, vectors, dummy datasets)
│   ├── components/            # Focused presentational components
│   │   ├── audit/             # Audit Log Dashboard, Table, Diff Modal, Timeline, & Metrics
│   │   ├── auth/              # LoginForm, MfaVerifyForm, RequireAuth wrapper
│   │   ├── calendar/          # SmartCalendar view elements, meeting dialogs, & timeline schedules
│   │   ├── chat/              # Chat message stream, input, thread panel, & channel/DM sidebars
│   │   │   ├── channelSettings/ # Channel archiving and preference dialogs
│   │   │   ├── dialogs/       # Channel creation and member invite modals
│   │   │   ├── panels/        # Sliding thread panels & channel detail sidebars
│   │   │   └── stream/        # Infinite scroll message streams & reaction pickers
│   │   ├── common/            # Shared cross-application components (GlobalConfirmModal)
│   │   ├── dashboard/         # Activity feed, statistics grid, scratchpad, & progress charts
│   │   ├── inbox/             # Universal Inbox list, header, summary widget, & quick actions
│   │   ├── layout/            # Navigation bar, Sidebar, & NoWorkspace fallbacks
│   │   ├── ownerAudit/        # Owner Security Command Center, Purge logs, rollback, & exports
│   │   ├── portfolio/         # Portfolio card index, project creation modals
│   │   ├── project/           # Focused project dashboards and layouts
│   │   │   ├── analytics/     # Metrics distribution charts
│   │   │   ├── calendar/      # Timeline and scheduling calendars
│   │   │   ├── dialogs/       # Project creation and member invites modals
│   │   │   ├── gantt/         # Project Gantt chart scheduling
│   │   │   ├── kanban/        # Drag-and-drop task boards
│   │   │   ├── milestones/    # Project Milestones card, task association pickers
│   │   │   ├── overview/      # Statistics, sidebars, and summary cards
│   │   │   ├── scrum/         # Agile Sprint planning, Epic backlogs, & Retrospective boards
│   │   │   ├── tasks/         # Filters and task listing tables
│   │   │   ├── whiteboard/    # Canvas drawing components, toolbar, and task-to-node wrappers
│   │   │   └── whiteboardView/# Share modals, page control bar, and layout container
│   │   ├── roles/             # Permissions matrix table, members lists, custom role forms
│   │   ├── settings/          # Profile details, password updates, delete workspace confirmation
│   │   ├── task/              # Task details, comments, selectors, & task creation dialogs
│   │   └── workspace/         # Workspace invite list, active stats, sub-teams tab, & settings
│   ├── configs/               # Client API connection config
│   │   └── api.js             # Axios client instance with auth headers interceptors
│   ├── context/               # React Context providers
│   │   ├── AuthContext.jsx    # User JWT credentials & profile state provider
│   │   └── SocketContext.jsx  # Real-time WebSocket connection state provider
│   ├── features/              # Redux Toolkit slices
│   │   ├── themeSlice.js      # Dark/light mode configuration state
│   │   ├── workspaceHelpers.js# Workspace permissions and switching helpers
│   │   └── workspaceSlice.js  # Current active workspace and member state
│   ├── hooks/                 # Custom React hooks
│   │   ├── useChat.js         # Core chat state and socket orchestration
│   │   ├── useChatChannels.js # Channel indexing and updates
│   │   ├── useChatMessages.js # Threaded message lists and mutations
│   │   ├── useProfileSettings.js # Profile state updates
│   │   ├── useSettings.js     # Settings context fetchers
│   │   └── useWorkspaceSettings.js # Workspace info update orchestrators
│   ├── pages/                 # Page containers & routes
│   │   ├── audit/             # AuditLogs page container
│   │   ├── auth/              # Auth sign-in / registration container page
│   │   ├── calendar/          # SmartCalendar container page
│   │   ├── chat/              # Chat system shell container page
│   │   ├── dashboard/         # User/Workspace Dashboard page
│   │   ├── inbox/             # Universal Inbox page container
│   │   ├── landing/           # Syncro marketing landing page
│   │   ├── layout/            # Root application layout shell
│   │   ├── legal/             # PrivacyPolicy and TermsOfService pages
│   │   ├── ownerAudit/        # OwnerAuditControl security command center (strict owner privilege)
│   │   ├── portfolio/         # Portfolios grid and PortfolioDetails views
│   │   ├── project/           # Projects and ProjectDetails views
│   │   ├── roles/             # RolePortal configurations page
│   │   ├── settings/          # Settings page container
│   │   ├── task/              # TaskDetails page container
│   │   ├── whiteboard/        # Whiteboard canvas container page
│   │   └── workspace/         # Workspace setup, team management, and accept-invite forms
│   ├── utils/                 # Utility files
│   │   └── permissions.js     # Dynamic client-side roles and permissions checker
│   ├── App.jsx                # Router route switch manager
│   ├── main.jsx               # Main React bundle mounting entry point & SW registration
│   └── index.css              # Styling configurations, colors, and fonts (Tailwind 4 base)
├── public/                    # Static public assets & Service Worker
│   └── service-worker.js      # Custom client-side PWA cache interceptor
├── jsconfig.json              # Client path alias resolution (`@/*`) configs
└── vite.config.js             # Vite compiler plugin configurations
```

---

## 📂 Server Architecture (`server/`)

The server is a Node.js Express 5 REST API utilizing Prisma ORM with PostgreSQL, alongside Inngest for distributed background event/cron processing.

```text
server/
├── controllers/               # Route controllers (grouped by domain)
│   ├── audit/                 # Audit controllers
│   │   ├── auditController.js # Domain exporter barrel file
│   │   ├── deleteAuditLogs.js # Purges workspace logs (Owner only)
│   │   ├── getAuditLogs.js    # Returns workspace activity audit entries
│   │   ├── getEntityHistory.js# Fetches rollback history for specific entities
│   │   └── rollbackEntity.js  # Restores database entity to an audited state
│   ├── auth/                  # User authentication handlers
│   │   ├── login.js           # Password validation & 2FA code dispatcher
│   │   ├── profile.js         # Profile updates & 2FA toggles
│   │   ├── register.js        # User account generation
│   │   └── verify.js          # Resolves 6-digit email 2FA codes
│   ├── chat/                  # Messaging controllers
│   │   ├── archive.js         # Archives channels
│   │   ├── channelsCrud.js    # Channel additions & edits
│   │   ├── membership.js      # Channel subscriptions & index
│   │   └── messageLogs.js     # Pinned, starred, and general messages fetchers
│   ├── inbox/                 # Notification inbox operations
│   │   ├── archiveItem.js     # Archives inbox notifications
│   │   ├── getInbox.js        # Returns priority unread alerts list
│   │   ├── inboxAction.js     # Direct actions on inbox items
│   │   ├── inboxController.js # Domain exporter barrel file
│   │   └── markRead.js        # Sets alert read states
│   ├── meeting/               # Meeting schedule events handlers
│   │   ├── meetingCreate.js   # Generates meetings, triggers external invites
│   │   ├── meetingStatus.js   # Update invite statuses (Accept/Decline)
│   │   └── meetingUpdate.js   # Modifies meeting timings & links
│   ├── milestone/             # Project milestone managers
│   │   ├── createMilestone.js # Creates project milestones
│   │   ├── deleteMilestone.js # Deletes milestones
│   │   ├── getMilestones.js   # Lists milestones for active projects
│   │   ├── linkTasks.js       # Binds database tasks to a milestone
│   │   └── updateMilestone.js # Updates milestone statuses and dates
│   ├── portfolio/             # Portfolio dashboard controllers
│   │   ├── createPortfolio.js # Generates portfolio folders
│   │   ├── deletePortfolio.js # Deletes portfolio listings
│   │   ├── getPortfolioDetails.js # Fetches linked portfolio project metrics
│   │   ├── getPortfolios.js   # Lists portfolios inside workspace
│   │   └── managePortfolioProjects.js # Associates projects to portfolios
│   ├── project/               # Project pipeline managers
│   │   ├── projectCreate.js   # Generates project pipelines
│   │   ├── projectUpdate.js   # Updates statuses and leads
│   │   └── stagesConfig.js    # Modifies stage configurations
│   ├── role/                  # Security matrix managers
│   │   ├── checkPermissionHelper.js # Resolves permission keys dynamically
│   │   ├── getRoleMatrix.js   # Returns workspace permission configurations
│   │   ├── manageCustomRole.js# Adds or deletes custom user roles
│   │   ├── roleController.js  # Role controller domain exporter
│   │   ├── updateMemberRole.js# Reassigns user roles
│   │   └── updateRoleMatrix.js# Reconfigures preset role permission matrixes
│   ├── task/                  # Task updates & operations
│   │   ├── taskCreate.js      # Creates tasks with dependencies
│   │   ├── taskRecurrence.js  # Runs background cron executions for recurrences
│   │   └── taskUpdate.js      # Updates priorities, assignee, dependencies
│   ├── whiteboard/            # Whiteboards canvas configurations
│   │   ├── whiteboardController.js # Whiteboard exporter barrel file
│   │   ├── whiteboardCrud.js  # Create, read, and delete board canvases
│   │   └── whiteboardSave.js  # Saves viewport, drawings, and node pages
│   ├── workspace/             # Workspace setups & onboarding flows
│   │   ├── inviteLink.js      # Creates and verifies workspace invite hashes
│   │   ├── workspaceCreate.js # Onboards personal or team workspaces
│   │   ├── workspaceMembers.js# Lists, invites, or removes workspace participants
│   │   ├── workspaceRole.js   # Dynamic workspace role reassignments
│   │   └── workspaceUpdate.js # Updates workspace details and layouts
│   ├── authController.js      # Auth orchestrator barrel file
│   ├── chatController.js      # Chat orchestrator barrel file
│   ├── commentController.js   # Task comments CRUD controllers
│   ├── googleCalendarController.js # Google Calendar OAuth/sync controllers
│   ├── meetingController.js   # Meetings CRUD orchestrator
│   ├── projectController.js   # Project orchestrator barrel file
│   ├── subTeamController.js   # Sub-teams management controllers
│   ├── taskController.js      # Task orchestrator barrel file
│   ├── whiteboardController.js # Whiteboard orchestrator barrel file
│   └── workspaceController.js # Workspace orchestrator barrel file
├── routes/                    # Express routing maps
│   ├── auditRoutes.js         # /api/audit routes (logs, rollbacks, purge)
│   ├── authRoutes.js          # /api/auth routes (registration, logins, verification)
│   ├── chatRoutes.js          # /api/chat routes (channels, messages, memberships)
│   ├── commentRoutes.js       # /api/comments routes (task commenting feed)
│   ├── googleCalendarRoutes.js # /api/google-calendar routes (OAuth sync actions)
│   ├── inboxRoutes.js         # /api/inbox routes (alerts index, archive logs)
│   ├── meetingRoutes.js       # /api/meetings routes (scheduling events)
│   ├── milestoneRoutes.js     # /api/milestones routes (milestone parameters)
│   ├── portfolioRoutes.js     # /api/portfolios routes (grouping portfolios)
│   ├── projectRoutes.js       # /api/projects routes (project stage settings)
│   ├── roleRoutes.js          # /api/roles routes (permissions matrix maps)
│   ├── subTeamRoutes.js       # /api/subteams routes (managing subteam memberships)
│   ├── taskRoutes.js          # /api/tasks routes (task card configurations)
│   ├── whiteboardRoutes.js    # /api/whiteboards routes (creating, updating canvases)
│   └── workspaceRoutes.js     # /api/workspaces routes (invitations, join controls)
├── services/                  # Business logic services
│   ├── auditLogger.js         # Centralized database audit log recorder service
│   └── googleCalendarService.js # Google OAuth and calendar calendar sync helper service
├── middlewares/               # Express routing middlewares
│   ├── authMiddleware.js      # JWT authentication resolver middleware
│   └── projectAccessCheck.js  # Project membership confirmation middleware
├── config/                    # Global database & SMTP configurations
│   ├── nodemailer.js          # Nodemailer SMTP transporter transporter instance
│   └── prisma.js              # Database client singleton instance
├── inngest/                   # Inngest background event processing worker
│   └── index.js               # Inngest client setups and cron schedules
├── prisma/                    # Relational schema configuration
│   └── schema.prisma          # Prisma PostgreSQL data models
├── server.js                  # Express application listener boot entry point
└── vercel.json                # Serverless deployment configuration details
```
