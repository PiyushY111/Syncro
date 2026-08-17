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
│   │   └── api.js             # Axios client instance with auth headers & confirmation interceptors
│   ├── context/               # React Context providers
│   │   ├── AuthContext.jsx    # User JWT credentials & profile state provider with unwrapped payloads
│   │   └── SocketContext.jsx  # Real-time WebSocket connection state provider
│   ├── features/              # Redux Toolkit slices
│   │   ├── themeSlice.js      # Dark/light mode configuration state
│   │   ├── workspaceHelpers.js# Workspace permissions and switching helpers
│   │   └── workspaceSlice.js  # Current active workspace and member state (ApiResponse unwrapped)
│   ├── hooks/                 # Custom React hooks
│   │   ├── useChat.js         # Core chat state and socket orchestration
│   │   ├── useChatChannels.js # Channel indexing and updates
│   │   ├── useChatMessages.js # Threaded message lists and mutations
│   │   ├── useProfileSettings.js # Profile state updates
│   │   ├── useSettings.js     # Settings context fetchers
│   │   └── useWorkspaceSettings.js # Workspace info update orchestrators
│   ├── pages/                 # Page containers & routes
│   │   ├── audit/             # AuditLogs page container
│   │   ├── auth/              # Auth sign-in / registration container page (with auto-reset 2FA state)
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
│   └── service-worker.js      # Custom client-side PWA cache interceptor (filters non-GET requests)
├── .env.example              # Client environment variables blueprint
├── jsconfig.json              # Client path alias resolution (`@/*`) configs
└── vite.config.js             # Vite compiler plugin configurations
```

---

## 📂 Server Architecture (`server/`)

The server is a Node.js Express 5 REST API and real-time Socket.IO server utilizing Prisma ORM with PostgreSQL, Upstash Redis for caching, and Inngest for background workers.

```text
server/
├── config/                    # Database, Redis, & SMTP configurations
│   ├── nodemailer.js          # SMTP transporter instance for 2FA & transactional emails
│   ├── prisma.js              # Database client singleton with $extends soft-delete findUnique delegates
│   ├── redis.js               # Upstash Redis REST client instance with memory fallback
│   └── test-smtp.js           # Transporter connection validation utility
├── controllers/               # Route controllers (grouped by domain)
│   ├── audit/                 # Audit controllers
│   │   ├── auditController.js # Domain exporter barrel file
│   │   ├── deleteAuditLogs.js # Purges workspace logs (Owner only)
│   │   ├── getAuditLogs.js    # Returns workspace activity audit entries
│   │   ├── getEntityHistory.js# Fetches rollback history for specific entities
│   │   └── rollbackEntity.js  # Restores database entity to an audited state
│   ├── auth/                  # User authentication handlers
│   │   ├── login.js           # Password validation & 2FA code dispatcher (with dev log)
│   │   ├── profile.js         # Profile updates & 2FA toggles
│   │   ├── register.js        # User account generation
│   │   └── verify.js          # Resolves 6-digit email 2FA codes (supports dev code 123456)
│   ├── chat/                  # Messaging controllers
│   │   ├── channelMembers.js  # Channel subscription & membership rosters
│   │   ├── channelsCrud.js    # Channel creation & management
│   │   ├── channelSettings.js # Channel parameters & privacy toggles
│   │   ├── chatController.js  # Chat domain exporter barrel file
│   │   ├── getMessages.js     # Message log fetchers with Redis caching
│   │   ├── messagesCrud.js    # Message creation, pinning, & deleting
│   │   ├── messagesDirect.js  # 1-on-1 direct message operations
│   │   └── channels/          # Channel archive, query, and membership handlers
│   ├── epic/                  # Epic roadmap management
│   │   ├── createEpic.js      # Generates project epics
│   │   ├── epicManage.js      # Modifies epic metadata & assignments
│   │   └── getProjectEpics.js # Retrieves project epic listings
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
│   │   ├── managePortfolioProjects.js # Associates projects to portfolios
│   │   └── updatePortfolio.js # Modifies portfolio attributes
│   ├── project/               # Project pipeline managers
│   │   ├── projectCreate.js   # Generates project pipelines
│   │   ├── projectDelete.js   # Soft deletes projects
│   │   ├── projectMembers.js  # Manages project member assignments
│   │   └── projectUpdate.js   # Updates statuses and leads
│   ├── retro/                 # Sprint retrospective controllers
│   │   ├── getSprintRetro.js  # Fetches retro columns & cards
│   │   └── retroItemActions.js# Handles card creation, votes, and deletions
│   ├── role/                  # Security matrix managers
│   │   ├── checkPermissionHelper.js # Resolves permission keys dynamically
│   │   ├── getRoleMatrix.js   # Returns workspace permission configurations
│   │   ├── manageCustomRole.js# Adds or deletes custom user roles
│   │   ├── roleController.js  # Role controller domain exporter
│   │   ├── updateMemberRole.js# Reassigns user roles
│   │   └── updateRoleMatrix.js# Reconfigures preset role permission matrixes
│   ├── sprint/                # Agile sprint controllers
│   │   ├── createSprint.js    # Creates project sprints
│   │   ├── getProjectSprints.js # Fetches sprint backlogs & statuses
│   │   ├── sprintCapacity.js  # Configures user story point capacities
│   │   ├── sprintLifecycle.js # Starts, completes, or archives sprints
│   │   └── sprintManage.js    # Edits sprint dates and goals
│   ├── task/                  # Task updates & operations
│   │   ├── taskCreate.js      # Creates tasks with dependencies & recurrence
│   │   ├── taskHelpers.js     # Internal task status validation helpers
│   │   ├── taskRecurrence.js  # Cron execution handler for recurring tasks
│   │   └── taskUpdate.js      # Updates priorities, assignees, and dependencies
│   ├── whiteboard/            # Whiteboards canvas configurations
│   │   ├── whiteboardController.js # Whiteboard exporter barrel file
│   │   ├── whiteboardCrud.js  # Create, read, and delete board canvases
│   │   └── whiteboardSave.js  # Saves viewport, drawings, and node pages
│   ├── workspace/             # Workspace setups & onboarding flows
│   │   ├── invites/           # Invite links, emails, and verification
│   │   ├── members/           # Workspace membership additions, role updates, and removal
│   │   ├── workspaceCreate.js # Onboards personal or team workspaces (optimized query performance)
│   │   ├── workspaceHelpers.js# Workspace permissions validation helpers
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
├── inngest/                   # Distributed background event processing worker
│   ├── client.js              # Inngest client initialization
│   ├── index.js               # Main worker exporter registering all background functions
│   ├── collab/                # Real-time collaboration background workers
│   │   ├── chatJobs.js        # Chat event processing & mentions
│   │   ├── commentJobs.js     # Task comment notifications
│   │   ├── meetingCreatedJob.js # Meeting invite email dispatches
│   │   ├── meetingUpdateDeleteJobs.js # Meeting updates & calendar sync jobs
│   │   └── whiteboardJobs.js  # Canvas save background snapshots
│   ├── core/                  # System core background jobs
│   │   ├── authJobs.js        # Email 2FA delivery & account events
│   │   ├── subTeamJobs.js     # Sub-team membership sync
│   │   └── workspaceMemberJobs.js # Workspace onboarding & member role alerts
│   ├── projects/              # Project management background jobs
│   │   ├── milestoneJobs.js   # Milestone deadline alert triggers
│   │   ├── portfolioJobs.js   # Portfolio roll-up recalculations
│   │   ├── projectJobs.js     # Project state change handlers
│   │   ├── retroJobs.js       # Retrospective board summaries
│   │   └── sprintEpicJobs.js  # Sprint rollover & epic progress tracking
│   └── tasks/                 # Task background jobs
│       ├── taskLifecycleJobs.js # Task assignment notifications & audit triggers
│       ├── taskRecurrenceJobs.js # Scheduled recurring task generators
│       └── taskUpdateJobs.js  # Task dependency check & status sync jobs
├── middlewares/               # Express routing middlewares
│   ├── authMiddleware.js      # JWT authentication resolver middleware
│   ├── errorMiddleware.js     # Centralized global Express error handler middleware
│   ├── projectAccessCheck.js  # Project membership confirmation middleware
│   ├── rateLimiter.js         # Environment-aware rate limiter middleware (authLimiter, apiLimiter)
│   ├── requestIdMiddleware.js # Request correlation ID (x-request-id) tracing middleware
│   ├── sanitize.js            # Input sanitization middleware
│   ├── securityHeaders.js     # Security headers (Helmet/CSP) middleware
│   └── validate.js            # Generic DTO request payload validation middleware
├── prisma/                    # Relational schema & database seed configuration
│   ├── schema.prisma          # Prisma PostgreSQL multi-column composite indexed data models
│   └── seed.js                # Enterprise multi-tenant database seed data generator
├── routes/                    # Express routing maps (18 domain routes)
│   ├── auditRoutes.js         # /api/audit routes (logs, rollbacks, purge)
│   ├── authRoutes.js          # /api/auth routes (registration, logins, verification)
│   ├── chatRoutes.js          # /api/chat routes (channels, messages, memberships)
│   ├── commentRoutes.js       # /api/comments routes (task commenting feed)
│   ├── epicRoutes.js          # /api/epics routes (epic planning & roadmaps)
│   ├── googleCalendarRoutes.js # /api/google-calendar routes (OAuth sync actions)
│   ├── inboxRoutes.js         # /api/inbox routes (alerts index, archive logs)
│   ├── meetingRoutes.js       # /api/meetings routes (scheduling events)
│   ├── milestoneRoutes.js     # /api/milestones routes (milestone parameters)
│   ├── portfolioRoutes.js     # /api/portfolios routes (grouping portfolios)
│   ├── projectRoutes.js       # /api/projects routes (project stage settings)
│   ├── retroRoutes.js         # /api/retros routes (sprint retrospectives)
│   ├── roleRoutes.js          # /api/roles routes (permissions matrix maps)
│   ├── sprintRoutes.js        # /api/sprints routes (sprint lifecycles & capacities)
│   ├── subTeamRoutes.js       # /api/subteams routes (managing subteam memberships)
│   ├── taskRoutes.js          # /api/tasks routes (task card configurations)
│   ├── whiteboardRoutes.js    # /api/whiteboards routes (creating, updating canvases)
│   └── workspaceRoutes.js     # /api/workspaces routes (invitations, join controls)
├── services/                  # Core application services & Database repositories
│   ├── auditLogger.js         # Centralized database audit log recorder service
│   ├── db/                    # Enterprise database service layer
│   │   └── dbService.js       # Transaction engine, health probes, soft delete, L2 cache wrapper
│   ├── eventBus.js            # Internal decoupled event emitter for background tasks
│   └── googleCalendarService.js # Google OAuth and calendar sync helper service
├── socket/                    # Socket.IO real-time event handlers
│   ├── messageHandler.js      # Real-time chat messages, typing status, & pins
│   ├── presenceHandler.js     # Real-time member online/offline status tracking
│   ├── reactionHandler.js     # Real-time message emoji reaction broadcasts
│   ├── retroHandler.js        # Real-time retrospective item creation & voting
│   ├── socketAuthMiddleware.js# WebSocket JWT connection authentication
│   ├── socketInit.js          # Socket.IO server setup & handler router
│   └── whiteboardHandler.js   # Real-time vector whiteboard & cursor position broadcast
├── tests/                     # Automated Test Suites
│   ├── advancedSecurity.test.js# Cryptographic hash chains, security headers, & input sanitization tests
│   ├── architecture.test.js   # Enterprise AppError, ApiResponse, DTO validation tests (16 passed)
│   ├── auth.test.js           # Authentication & 2FA endpoint tests
│   ├── chat.test.js           # Messaging & channel endpoint tests
│   ├── concurrency.test.js    # Distributed stampede locking & transaction retry tests
│   ├── database.test.js       # DB connection health, transaction retries, soft delete tests (7 passed)
│   ├── inbox.test.js          # Inbox notification tests
│   ├── permissions.test.js    # Role matrix & permission enforcement tests
│   ├── rateLimit2FA.test.js   # 2FA rate limiting and security tests
│   ├── redis.test.js          # Redis caching & versioning tests
│   ├── runAllTests.js         # Enterprise test suite orchestrator
│   ├── security.test.js       # AES-256-GCM encryption & constant-time comparison tests (13 passed)
│   ├── stress5k.test.js       # 5,000 concurrent user load benchmark
│   ├── transaction.test.js    # Outbox pattern & Dead-Letter Queue (DLQ) tests
│   └── workspace.test.js      # Workspace management & onboarding tests
├── utils/                     # Enterprise cross-cutting utilities
│   ├── errors/                # Operational Error Class Hierarchy
│   │   └── appError.js        # AppError base class & status-code-specific subclasses
│   ├── logger/                # Structured Telemetry Logger
│   │   └── logger.js          # Production JSON logger with request correlation IDs
│   ├── response/              # Unified API Response Formatter
│   │   └── apiResponse.js     # Standardized ApiResponse success/error payload contract
│   └── asyncHandler.js        # Async controller wrapper for exception isolation
├── validators/                # Request DTO Validation Schemas
│   └── authValidators.js      # Input validation functions for Auth requests
├── server.js                  # Express application listener & Socket.IO boot entry point
└── vercel.json                # Serverless deployment configuration details
```

---

## 📂 End-to-End Testing Architecture (`e2e/`)

The end-to-end browser testing framework uses Playwright for multi-browser automated user journey verification.

```text
e2e/
├── auth.spec.js               # E2E User registration, login, and 2FA verification flow
├── chat.spec.js               # E2E Multi-user real-time channel chat & thread interactions
├── tasks.spec.js              # E2E Kanban drag-and-drop task creation & status updating
├── whiteboard.spec.js         # E2E Vector canvas drawing & collaborative cursor movements
└── workspace.spec.js          # E2E Team member onboarding, invitations, & role management
```
