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
│   │   ├── admin/             # GatekeeperAdmin subcomponents (Stats, Policies, Users, VIP)
│   │   ├── audit/             # Audit Log Dashboard, Table, Diff Modal, Timeline, & Metrics
│   │   ├── auth/              # LoginForm, MfaVerifyForm, RequireAuth wrapper
│   │   ├── calendar/          # SmartCalendar view elements, EventDetailModal, & meeting dialogs
│   │   ├── chat/              # Chat message stream, input, thread panel, & channel/DM sidebars
│   │   ├── common/            # Shared cross-application components (GlobalConfirmModal)
│   │   ├── dashboard/         # Activity feed, statistics grid, scratchpad, & progress charts
│   │   ├── inbox/             # Universal Inbox list, header, summary widget, & quick actions
│   │   ├── layout/            # Navigation bar, Sidebar, & NoWorkspace fallbacks
│   │   ├── ownerAudit/        # Owner Security Command Center, Purge logs, rollback, & exports
│   │   ├── portfolio/         # Portfolio card index, project creation modals
│   │   ├── project/           # Focused project dashboards and layouts
│   │   ├── roles/             # Permissions matrix table, members lists, custom role forms
│   │   ├── settings/          # Profile details, password updates, delete workspace confirmation
│   │   ├── task/              # Task details, comments, selectors, & task creation dialogs
│   │   ├── ui/                # Radix UI design primitives
│   │   └── workspace/         # Workspace invite list, active stats, sub-teams tab, & settings
│   ├── features/              # Domain-driven feature modules & Redux slices
│   │   ├── admin/             # Admin feature module barrel
│   │   ├── audit/             # Audit feature module barrel
│   │   ├── auth/              # Auth feature module barrel
│   │   ├── calendar/          # Calendar feature module barrel
│   │   ├── chat/              # Chat feature module barrel
│   │   ├── dashboard/         # Dashboard feature module barrel
│   │   ├── inbox/             # Inbox feature module barrel
│   │   ├── milestone/         # Milestone feature module barrel
│   │   ├── portfolio/         # Portfolio feature module barrel
│   │   ├── project/           # Project feature module barrel
│   │   ├── retro/             # Retro feature module barrel
│   │   ├── roles/             # Roles feature module barrel
│   │   ├── settings/          # Settings feature module barrel
│   │   ├── sprint/            # Sprint feature module barrel
│   │   ├── task/              # Task feature module barrel
│   │   ├── theme/             # Theme slice & feature barrel
│   │   ├── whiteboard/        # Whiteboard feature module barrel
│   │   ├── workspace/         # Workspace slice, helpers & feature barrel
│   │   ├── themeSlice.js      # Dark/light mode configuration state
│   │   ├── workspaceHelpers.js# Workspace permissions and switching helpers
│   │   └── workspaceSlice.js  # Current active workspace and member state
│   ├── shared/                # Shared domain-agnostic assets & primitives
│   │   ├── api/               # Axios client instance (client.js)
│   │   ├── lib/               # Utility functions (cn class merging)
│   │   ├── types/             # Domain TypeScript interface contracts (domain.d.ts)
│   │   └── utils/             # Re-exported utility functions (permissions)
│   ├── test/                  # Vitest test setup and configuration
│   │   └── setup.js           # DOM matchers & localStorage polyfill
│   ├── hooks/                 # Custom React hooks
│   │   ├── useChat.js         # Core chat state and socket orchestration
│   │   ├── useChatChannels.js # Channel indexing and updates
│   │   ├── useChatMessages.js # Threaded message lists and mutations
│   │   ├── useProfileSettings.js # Profile state updates
│   │   ├── useSettings.js     # Settings context fetchers
│   │   └── useWorkspaceSettings.js # Workspace info update orchestrators
│   ├── pages/                 # Dynamically imported route page containers (React.lazy)
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
│   ├── utils/                 # Utility files & cryptographic modules
│   │   ├── permissions.js     # Dynamic client-side roles and permissions checker
│   │   ├── shieldCrypto.js    # Client WebCrypto ECDH P-256, AES-256-GCM, HKDF-SHA256, HMAC-SHA256
│   │   └── shieldSession.js   # Active session manager, handshake orchestration, & atomic nonce tracker
│   ├── App.jsx                # Router switch manager with React.lazy dynamic chunk code-splitting & Suspense
│   ├── main.jsx               # SPA mounting entry point & conditional environment-scoped SW registration
│   └── index.css              # Styling configurations, colors, and fonts (Tailwind 4 base)
├── public/                    # Static public assets & Service Worker
│   └── service-worker.js      # Production-scoped PWA cache interceptor (GET request caching & offline assets)
├── .env.example              # Client environment variables blueprint
├── jsconfig.json              # Client path alias resolution (`@/*`) configs
├── tsconfig.json              # TypeScript configuration
├── vitest.config.js           # Vitest unit & component test configuration
└── vite.config.js             # Vite compiler plugin configurations
```

---

## 📂 Server Architecture (`server/`)

The server is a Node.js Express 5 REST API and real-time Socket.IO server utilizing Prisma ORM with PostgreSQL, Upstash Redis for caching, and Inngest for background workers.

```text
server/
├── prisma/                    # Database schema, migrations & seed pipeline
├── tests/                     # Unit & Enterprise Integration test suites
├── src/                       # 📦 ALL APPLICATION SOURCE CODE
│   ├── app.js                 # Express application orchestrator & route mounts
│   ├── cache/                 # Upstash Redis caching utilities & stampede lock
│   ├── config/                # Persistent infrastructure configs (Prisma, Redis, Nodemailer)
│   │   ├── nodemailer.js      # SMTP transporter instance for 2FA & transactional emails
│   │   ├── prisma.js          # Prisma Client with $extends soft-delete delegates & encryption
│   │   └── redis.js           # Upstash Redis client with in-memory fallback
│   ├── controllers/           # Domain route controllers
│   │   ├── admin/             # Gatekeeper super-admin policies & user directory
│   │   ├── audit/             # Audit logs, hash verification & time-travel rollback
│   │   ├── auth/              # Registration, login, 2FA & sessions
│   │   ├── chat/              # Channels, DMs & real-time messaging
│   │   ├── epic/              # Epic creation & backlog management
│   │   ├── inbox/             # Unified notifications & inbox items
│   │   ├── meeting/           # Meeting scheduler & invite RSVP
│   │   ├── milestone/         # Project milestones & task associations
│   │   ├── portfolio/         # Multi-project portfolio dashboards
│   │   ├── project/           # Projects CRUD & member assignments
│   │   ├── retro/             # Sprint retrospectives & action items
│   │   ├── role/              # RBAC matrix & custom role management
│   │   ├── sprint/            # Sprint lifecycle & velocity capacity
│   │   ├── task/              # Task lifecycle, priorities & recurrence
│   │   ├── whiteboard/        # Vector whiteboard canvas & node persistence
│   │   └── workspace/         # Workspace setups, members, invites & tenant configs
│   ├── inngest/               # Distributed background event workers
│   │   ├── collab/            # Chat, comment, whiteboard, meeting background jobs
│   │   ├── core/              # Auth, sub-team, workspace member jobs
│   │   ├── projects/          # Milestone, portfolio, project, retro jobs
│   │   └── tasks/             # Task lifecycle, update & recurrence jobs
│   ├── middlewares/           # Express middleware pipeline
│   │   ├── authMiddleware.js  # JWT validation & Redis revocation blacklist
│   │   ├── errorMiddleware.js # Centralized AppError handling
│   │   ├── metricsMiddleware.js # Prometheus telemetry metrics
│   │   ├── rateLimiter.js     # IP & user-based rate limiting
│   │   ├── requestIdMiddleware.js # Unique x-request-id correlation tracing
│   │   ├── sanitize.js        # Strict payload XSS sanitization
│   │   ├── securityHeaders.js # Helmet CSP, HSTS & frame protection
│   │   ├── superAdminMiddleware.js # Super-admin access enforcement
│   │   └── validate.js        # DTO request schema validation interceptor
│   ├── routes/                # Express REST & Gateway route endpoints
│   ├── services/              # Domain business logic engines
│   │   ├── auditLogger.js     # SHA-256 tamper-evident hash chaining
│   │   ├── db/dbService.js    # Resilient transaction retries & stampede locks
│   │   ├── gatekeeperService.js # Whitelist policy resolution & registration gating
│   │   ├── googleCalendarService.js # Google Calendar bidirectional sync
│   │   └── shieldEngine.js    # Zero-Trust ECDH P-256 cloaked gateway engine
│   ├── socket/                # Real-time WebSocket Socket.IO engine
│   │   ├── messageHandler.js  # Real-time chat & typing events
│   │   ├── presenceHandler.js # Online member presence tracking
│   │   ├── reactionHandler.js # Message reaction broadcast
│   │   ├── retroHandler.js    # Live retrospective card syncing
│   │   ├── socketInit.js      # Socket.IO bootstrap & Redis adapter
│   │   └── whiteboardHandler.js # Live drawing coordinate sync
│   ├── utils/                 # Cross-cutting infrastructure utilities
│   │   ├── asyncHandler.js    # Express async error boundary wrapper
│   │   ├── crypto.js          # AES-256-GCM encryption & hashing
│   │   ├── errors/appError.js # Operational AppError class hierarchy
│   │   ├── logger/logger.js   # Winston structured JSON telemetry
│   │   └── response/apiResponse.js # Unified response formatting
│   └── validators/            # Centralized DTO schema validators
├── .env
├── .env.example
├── eslint.config.js
├── package.json
├── package-lock.json
├── server.js                  # Lightweight HTTP listener bootstrap & graceful shutdown
├── tsconfig.json
├── vercel.json
└── vitest.config.jsarchives sprints
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
├── routes/                    # Express routing maps (19 domain routes)
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
│   ├── shieldRoutes.js        # /api/v2/shield routes (handshake & cloaked synthetic dispatch gateway)
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
│   ├── googleCalendarService.js # Google OAuth and calendar sync helper service
│   └── shieldEngine.js        # Zero-trust cryptographic cloaking engine, ECDH/HKDF/AES-256-GCM, anti-replay nonce store
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
│   ├── concurrency.test.js    # Distributed stampede locking & transaction retry tests (7 passed)
│   ├── database.test.js       # DB connection health, transaction retries, soft delete tests (7 passed)
│   ├── domainInvariants.test.js# Domain business rules, sprint lifecycles & task dependencies (10 passed)
│   ├── gatekeeper.test.js     # RBAC roles & super-admin policy tests (11 passed)
│   ├── inbox.test.js          # Inbox notification tests
│   ├── permissions.test.js    # Role matrix & permission enforcement tests
│   ├── rateLimit2FA.test.js   # 2FA rate limiting and security tests
│   ├── redis.test.js          # Redis caching & versioning tests
│   ├── runAllTests.js         # Enterprise test suite orchestrator (8 suites)
│   ├── security.test.js       # AES-256-GCM encryption & constant-time comparison tests (13 passed)
│   ├── shield.test.js         # Shield zero-trust cryptographic unit tests (12 passed)
│   ├── shieldE2E.test.js      # Shield end-to-end handshake & synthetic cloaked dispatch tests (8 passed)
│   ├── stress5k.test.js       # 5,000 concurrent user load benchmark
│   ├── transaction.test.js    # Outbox pattern & Dead-Letter Queue (DLQ) tests (9 passed)
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
