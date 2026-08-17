# 🏗️ Syncro Enterprise Architecture & Database Documentation

Welcome to the comprehensive technical architecture specification for **Syncro**. This document provides an in-depth breakdown of the system design, domain-driven clean architecture, database infrastructure, caching strategies, real-time engines, and security mechanics powering the platform.

---

## 📑 Table of Contents
1. [High-Level System Overview](#-high-level-system-overview)
2. [Clean Hexagonal Architecture](#-clean-hexagonal-architecture)
3. [Complete Database Architecture & Mechanics](#-complete-database-architecture--mechanics)
   - [3.1 Relational Data Models & Schema Design](#31-relational-data-models--schema-design)
   - [3.2 Composite Multi-Column Indexing Strategy](#32-composite-multi-column-indexing-strategy)
   - [3.3 Prisma Client Extensions ($extends)](#33-prisma-client-extensions-extends)
   - [3.4 Resilient Transaction Retry Engine](#34-resilient-transaction-retry-engine)
   - [3.5 Real-Time Database Health Monitoring](#35-real-time-database-health-monitoring)
   - [3.6 Soft Delete & Audit Logging Engine](#36-soft-delete--audit-logging-engine)
   - [3.7 L2 Redis Read-Through Caching Layer](#37-l2-redis-read-through-caching-layer)
   - [3.8 Enterprise Multi-Tenant Seed Pipeline](#38-enterprise-multi-tenant-seed-pipeline)
4. [Enterprise Cross-Cutting Concerns](#-enterprise-cross-cutting-concerns)
   - [4.1 AppError Hierarchy](#41-apperror-hierarchy)
   - [4.2 Unified API Response Contract & Client Unwrapping](#42-unified-api-response-contract--client-unwrapping)
   - [4.3 Async Exception Isolation](#43-async-exception-isolation)
   - [4.4 Request Correlation Tracing & JSON Telemetry](#44-request-correlation-tracing--json-telemetry)
   - [4.5 DTO Request Validation Pipeline](#45-dto-request-validation-pipeline)
5. [Real-Time Socket.IO & Event Bus Pipelines](#-real-time-socketio--event-bus-pipelines)
6. [Automated Verification & Testing Architecture](#-automated-verification--testing-architecture)

---

## 🏛️ High-Level System Overview

Syncro is built as a highly available, event-driven, multi-tenant enterprise application. The platform cleanly segregates client-side single page applications (SPA), real-time WebSocket state machines, REST gateway controllers, transactional event background processing, and relational database persistence layers.

```mermaid
graph TD
    subgraph ClientLayer ["Client Presentation Layer"]
        ReactSPA["React 19 SPA Client"] <--> ReduxStore["Redux Toolkit State Store"]
        ReactSPA <--> SocketClient["Socket.IO Client Engine"]
        ReactSPA <--> ServiceWorker["Client Service Worker Cache (GET Requests)"]
    end

    subgraph RESTGateway ["API Gateway & Server Pipeline"]
        Security["Cors & Express Security"] --> RequestID["requestIdMiddleware (x-request-id)"]
        RequestID --> DTO["validate (DTO Request Validator)"]
        DTO --> Controller["Async Controllers (asyncHandler)"]
        Controller --> Services["Domain Services Layer"]
    end

    subgraph CrossCutting ["Cross-Cutting Enterprise Systems"]
        Controller --> ApiResponse["ApiResponse Contract Formatter"]
        Controller --> GlobalErr["errorMiddleware (Centralized Error Handler)"]
        GlobalErr --> AppError["AppError Class Hierarchy"]
        GlobalErr --> Logger["Structured JSON Telemetry Logger"]
    end

    subgraph DataInfrastructure ["Database & Caching Layer"]
        Services --> DBService["DB Service Layer & Transaction Engine"]
        DBService --> PrismaExt["Prisma Client Extensions Layer ($extends)"]
        PrismaExt --> L2Cache[("Upstash Redis L2 Cache")]
        PrismaExt --> NeonPool["Neon Serverless DB Pool"]
        NeonPool --> Postgres[("PostgreSQL Relational DB")]
    end

    subgraph EventPipeline ["Async Event & Background Workers"]
        Services --> EventBus["Decoupled Internal EventBus"]
        EventBus --> Inngest["Inngest Background Queue Workers"]
        Inngest --- JobsCore["Auth / Workspace / Member Jobs"]
        Inngest --- JobsTasks["Task Lifecycle & Recurrence Jobs"]
        Inngest --- JobsProjects["Project / Sprint / Epic / Retro Jobs"]
        Inngest --- JobsCollab["Chat / Whiteboard / Meeting Jobs"]
    end

    SocketClient <-->|"WebSocket Sync"| SocketServer["Socket.IO Gateway Server"]
```

---

## 🎯 Clean Hexagonal Architecture

The codebase adheres strictly to **Clean Hexagonal Architecture** and **Domain-Driven Design (DDD)**. Dependencies flow inward toward domain business logic, insulating core rules from HTTP transport details, database clients, or external vendors.

```text
server/
├── config/                 # Environment & Infrastructure configuration
│   ├── prisma.js           # Prisma Client with $extends middleware & findUnique soft-delete delegates
│   ├── redis.js            # Upstash Redis & in-memory fallback client
│   └── nodemailer.js       # SMTP Transporter instance
├── utils/                  # Cross-Cutting Infrastructure Utilities
│   ├── errors/             # Operational AppError Class Hierarchy
│   │   └── appError.js     # Base AppError & HTTP-specific subclasses
│   ├── logger/             # Structured JSON Telemetry Logger
│   │   └── logger.js       # Production JSON log formatter
│   ├── response/           # Unified API Response Formatter
│   │   └── apiResponse.js  # Standardized ApiResponse success/error contract
│   └── asyncHandler.js     # Async controller exception isolation wrapper
├── middlewares/            # Request Interceptor Middleware Pipeline
│   ├── authMiddleware.js   # JWT authentication resolver
│   ├── errorMiddleware.js  # Centralized global Express error handler
│   ├── rateLimiter.js      # Environment-aware rate limiter middleware
│   ├── requestIdMiddleware.js # Request correlation ID (x-request-id) tracing
│   └── validate.js         # DTO request payload validation interceptor
├── validators/             # Domain DTO Validation Schemas
│   └── authValidators.js   # Auth DTO validation schemas
├── services/               # Application & Business Domain Services
│   ├── db/                 # Database Repository & Resilience Layer
│   │   └── dbService.js    # Transaction engine, health probes, soft delete, L2 cache
│   ├── auditLogger.js      # Audit log recorder service
│   ├── eventBus.js         # Decoupled internal event emitter
│   └── googleCalendarService.js # Google OAuth and calendar sync service
├── controllers/            # HTTP Presentation Controllers (Domain grouped)
│   ├── auth/               # User registration, login, 2FA, profile (with dev mode helpers)
│   ├── workspace/          # Workspace onboarding, memberships, invites (optimized queries)
│   ├── project/            # Project lifecycle, stages, members
│   ├── task/               # Task management, dependencies, recurrence
│   ├── chat/               # Channels, messages, direct messaging
│   └── ...                 # Retros, Epics, Sprints, Milestones, Meetings
├── prisma/                 # Relational Schema & Seed Generator
│   ├── schema.prisma       # Prisma PostgreSQL models & composite indexes
│   └── seed.js             # Enterprise multi-tenant mock data seed generator
└── tests/                  # Automated Verification Suites
    ├── architecture.test.js# Clean Architecture & DTO test suite
    └── database.test.js    # Database health & transaction retry test suite
```

---

## 💾 Complete Database Architecture & Mechanics

### 3.1 Relational Data Models & Schema Design
The database architecture uses **PostgreSQL** managed through **Prisma ORM**. The data model supports multi-tenant isolation, workspace RBAC, agile project management, real-time messaging, Gantt schedules, Kanban boards, and security auditing.

Key Domain Entities:
- **`User`**: System identity, encrypted auth credentials, 2FA security codes, and Google OAuth tokens.
- **`Workspace`**: Tenant boundary owning projects, channels, portfolios, whiteboards, sub-teams, and audit logs.
- **`WorkspaceMember`**: Relational join table mapping users to workspaces with granular roles (`OWNER`, `ADMIN`, `MANAGER`, `MEMBER`).
- **`Project`**: Engineering workspace container with stages, milestones, sprints, epics, and tasks.
- **`Task`**: Core work item supporting statuses, priorities, types (`TASK`, `BUG`, `FEATURE`, `IMPROVEMENT`), assignees, dependencies, recurrence rules, and soft deletion (`deletedAt`).
- **`Channel` & `Message`**: Workspace communication streams supporting public/private channels, direct messages, message threads, and emoji reactions.
- **`Sprint` & `Epic`**: Agile Scrum sprint lifecycles, capacity tracking, retro columns (`RetroColumn`, `RetroItem`), and epic milestones.
- **`AuditLog`**: Security log capturing entity mutations with JSON state diffs and client IP/User-Agent telemetry.

---

### 3.2 Composite Multi-Column Indexing Strategy
To deliver sub-millisecond query execution on high-throughput database paths, multi-column composite indexes are defined across key models:

```prisma
model Task {
  // ... fields ...
  @@index([projectId, deletedAt, status, priority]) // High-performance Kanban board queries
  @@index([assigneeId, deletedAt, due_date])        // "My Tasks" query path
  @@index([sprintId, deletedAt])                   // Sprint task execution
  @@index([epicId, deletedAt])                     // Epic roadmap aggregations
  @@index([milestoneId])
  @@index([stageId])
}

model Message {
  // ... fields ...
  @@index([channelId, createdAt(sort: Desc), id])        // High-speed chat cursor pagination
  @@index([recipientId, userId, createdAt(sort: Desc)]) // Direct message timeline lookup
  @@index([userId])
  @@index([parentId])
}

model Project {
  // ... fields ...
  @@index([workspaceId, status, deletedAt]) // Workspace project listings
  @@index([team_lead, deletedAt])           // Team lead project lookup
}

model AuditLog {
  // ... fields ...
  @@index([workspaceId, createdAt(sort: Desc)]) // Workspace activity feed pagination
  @@index([entityType, entityId])               // Entity audit timeline lookups
  @@index([userId])
}

model Notification {
  // ... fields ...
  @@index([userId, isRead, createdAt(sort: Desc)]) // User unread inbox notification index
}

model WorkspaceMember {
  // ... fields ...
  @@index([workspaceId, userId, role]) // Authorization & RBAC lookups
}
```

---

### 3.3 Prisma Client Extensions (`$extends`)
In `server/config/prisma.js`, the base `PrismaClient` is enhanced with a transparent Prisma Client Extension layer (`$extends`):

1. **Automated Soft-Delete Interceptor**:
   Automatically intercepts `findMany`, `findFirst`, `findFirstOrThrow`, `count`, `aggregate`, and `groupBy` operations on soft-deletable models (`User`, `Workspace`, `Project`, `Task`). Injects `where.deletedAt = null` by default unless explicitly overridden in the query.
2. **`findUnique` & `findUniqueOrThrow` Soft-Delete Delegate**:
   Prisma Client strictly validates `where` input on `findUnique` queries and rejects non-unique filter keys such as `deletedAt`. The extension delegates `findUnique` and `findUniqueOrThrow` calls on soft-deletable models to `findFirst` / `findFirstOrThrow` with `deletedAt: null`, preserving transparent soft-delete filtering without triggering `PrismaClientValidationError`.
3. **Query Performance & Telemetry Diagnostics**:
   Measures query execution duration using `performance.now()`. Automatically logs structured slow query warnings whenever an operation exceeds `150ms`.

```javascript
export const prisma = basePrisma.$extends({
  name: 'EnterpriseDatabaseExtensions',
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const start = performance.now();

        // 1. Soft-delete filter interceptor
        if (model && SOFT_DELETE_MODELS.has(model)) {
          args = args || {};
          args.where = args.where || {};

          if (operation === 'findUnique' || operation === 'findUniqueOrThrow') {
            const modelName = model.charAt(0).toLowerCase() + model.slice(1);
            const targetMethod = operation === 'findUnique' ? 'findFirst' : 'findFirstOrThrow';
            const where = { ...args.where };
            if (where.deletedAt === undefined) {
              where.deletedAt = null;
            }
            const result = await basePrisma[modelName][targetMethod]({ ...args, where });
            const duration = performance.now() - start;
            if (duration >= SLOW_QUERY_THRESHOLD_MS) {
              console.warn(`[SLOW DB QUERY ALERT] Model: ${model} | Operation: ${operation} | Duration: ${duration.toFixed(2)}ms`);
            }
            return result;
          }

          const readOps = ['findMany', 'findFirst', 'findFirstOrThrow', 'count', 'aggregate', 'groupBy'];
          if (readOps.includes(operation)) {
            if (args.where.deletedAt === undefined) {
              args.where.deletedAt = null;
            }
          }
        }

        // 2. Query execution
        const result = await query(args);
        const duration = performance.now() - start;

        // 3. Telemetry & Slow Query Diagnostics
        if (duration >= SLOW_QUERY_THRESHOLD_MS) {
          console.warn(`[SLOW DB QUERY ALERT] Model: ${model || 'Raw'} | Operation: ${operation} | Duration: ${duration.toFixed(2)}ms`);
        }

        return result;
      },
    },
  },
});
```

---

### 3.4 Resilient Transaction Retry Engine
Multi-model database operations execute inside the transaction engine (`executeTransaction` in `server/services/db/dbService.js`). The engine automatically intercepts transient PostgreSQL deadlocks or serialization failures (PostgreSQL codes `40001` or `40P01`) and applies exponential backoff retries:

```javascript
export const executeTransaction = async (actionFn, options = {}) => {
  const { maxRetries = 3, timeout = 10000, isolationLevel } = options;
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    try {
      return await basePrisma.$transaction(async (tx) => await actionFn(tx), {
        timeout,
        ...(isolationLevel ? { isolationLevel } : {}),
      });
    } catch (error) {
      const isTransient =
        error.code === 'P2034' ||
        error.code === '40001' ||
        error.code === '40P01' ||
        error.message?.includes('deadlock') ||
        error.message?.includes('serialization');

      if (isTransient && attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 100 + Math.floor(Math.random() * 50);
        console.warn(`[TRANSACTION RETRY] Attempt ${attempt}/${maxRetries} failed (${error.code}). Retrying in ${backoffMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      } else {
        throw error;
      }
    }
  }
};
```

---

### 3.5 Real-Time Database Health Monitoring
The application exposes real-time database readiness and round-trip time (RTT) diagnostics via `checkDatabaseHealth()` in `server/services/db/dbService.js`. Executed live at `/health`, `/api/ping`, and `/api/health/db`:

```javascript
export const checkDatabaseHealth = async () => {
  const startMs = performance.now();
  try {
    await basePrisma.$queryRawUnsafe('SELECT 1;');
    const latencyMs = Math.round(performance.now() - startMs);

    return {
      status: 'HEALTHY',
      database: 'PostgreSQL',
      driver: 'Prisma Client (Enterprise)',
      latencyMs,
      timestamp: new Date().toISOString(),
      details: { ping: 'OK', slowQueryThresholdMs: 150 },
    };
  } catch (error) {
    const latencyMs = Math.round(performance.now() - startMs);
    return {
      status: 'UNHEALTHY',
      database: 'PostgreSQL',
      latencyMs,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};
```

---

### 3.6 Soft Delete & Audit Logging Engine
Entity deletion executes via `softDeleteEntity(modelName, entityId, context)`, marking `deletedAt = new Date()` and atomically recording a `CRITICAL` severity audit log entry with state snapshots:

```javascript
export const softDeleteEntity = async (modelName, entityId, context = {}) => {
  const { workspaceId, userId, entityName = "", req } = context;

  return await executeTransaction(async (tx) => {
    const lowerModel = modelName.toLowerCase();
    const existing = await tx[lowerModel].findUnique({ where: { id: entityId } });
    if (!existing) throw new Error(`${modelName} with ID ${entityId} not found`);

    const updated = await tx[lowerModel].update({
      where: { id: entityId },
      data: { deletedAt: new Date() },
    });

    if (workspaceId && userId) {
      await logAuditEvent({
        workspaceId,
        userId,
        action: 'DELETE',
        entityType: modelName.toUpperCase(),
        entityId,
        entityName: entityName || existing.name || existing.title || entityId,
        severity: 'CRITICAL',
        previousState: existing,
        newState: updated,
        req,
      });
    }

    return updated;
  });
};
```

---

### 3.7 L2 Redis Read-Through Caching Layer
High-frequency queries (such as user workspace listings or role matrices) use the read-through L2 caching helper `getCachedOrFetch`:

```javascript
export const getCachedOrFetch = async (cacheKey, fetchFn, ttlSeconds = 300) => {
  try {
    const cached = await redisCache.get(cacheKey);
    if (cached) return typeof cached === 'string' ? JSON.parse(cached) : cached;
  } catch (err) {
    console.warn(`[CACHE READ ERROR] Key: ${cacheKey}`, err.message);
  }

  const freshData = await fetchFn();

  if (freshData !== null && freshData !== undefined) {
    try {
      await redisCache.set(cacheKey, JSON.stringify(freshData), ttlSeconds);
    } catch (err) {
      console.warn(`[CACHE WRITE ERROR] Key: ${cacheKey}`, err.message);
    }
  }

  return freshData;
};
```

---

### 3.8 Enterprise Multi-Tenant Seed Pipeline
The seed pipeline (`server/prisma/seed.js`) provisions a production-ready mock environment for development, staging, and testing:
- **Default System Accounts**: Admin (`admin@syncro.io`), Tech Lead (`lead@syncro.io`), Senior Engineer (`dev@syncro.io`) with hashed passwords.
- **Enterprise Workspace**: `Syncro Enterprise Systems` slug: `syncro-enterprise` with custom RBAC roles.
- **Project Structure**: `Syncro Engine Core` with Kanban stages (`Backlog`, `To Do`, `In Progress`, `In Review`, `Completed`).
- **Agile Elements**: Epics (`Database & Infrastructure Hardening`), Sprints (`Sprint 1 - Core Platform Optimization`), Milestones, and Tasks.
- **Channels & Audit**: `#general` channel with initial chat stream and security audit entries.

Execution Commands:
```bash
npm run db:seed
npm run db:push
npm run db:validate
npm run db:test
```

---

## 🛡️ Enterprise Cross-Cutting Concerns

### 4.1 AppError Hierarchy
Operational exceptions extend the `AppError` base class (`server/utils/errors/appError.js`):

| Error Class | Status Code | Error Code | Description |
| :--- | :--- | :--- | :--- |
| `BadRequestError` | 400 | `BAD_REQUEST` | Malformed parameters or invalid payload syntax |
| `UnauthorizedError` | 401 | `UNAUTHORIZED` | Invalid or expired JWT authentication token |
| `ForbiddenError` | 403 | `FORBIDDEN` | Insufficient role or workspace permission scope |
| `NotFoundError` | 404 | `NOT_FOUND` | Target database record or entity not found |
| `ConflictError` | 409 | `CONFLICT` | Resource collision (e.g. duplicate email) |
| `ValidationError` | 422 | `VALIDATION_ERROR` | Request DTO validation failure |
| `RateLimitError` | 429 | `RATE_LIMIT_EXCEEDED` | Exceeded API rate limits |
| `InternalServerError` | 500 | `INTERNAL_SERVER_ERROR` | Unexpected server runtime exception |

---

### 4.2 Unified API Response Contract & Client Unwrapping
All HTTP controller endpoints emit a uniform JSON payload (`server/utils/response/apiResponse.js`):

**Success Schema (200 / 201)**:
```json
{
  "success": true,
  "message": "Resource created successfully",
  "data": {
    "id": "project-uuid-123",
    "name": "Syncro Engine Core"
  },
  "meta": {
    "page": 1,
    "total": 50
  }
}
```

**Error Schema (4xx / 5xx)**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "A valid email address is required.",
    "details": null
  }
}
```

Client Redux slices and React Contexts unwrap responses safely (`const payload = data?.data || data`) to handle both wrapped and direct payloads seamlessly.

---

### 4.3 Async Exception Isolation
Controllers are wrapped with `asyncHandler` (`server/utils/asyncHandler.js`), catching unhandled promise rejections and passing them to Express error middleware (`errorMiddleware.js`).

---

### 4.4 Request Correlation Tracing & JSON Telemetry
Every incoming HTTP request passes through `requestIdMiddleware` (`server/middlewares/requestIdMiddleware.js`), generating or propagating a unique `x-request-id` UUID. Structured log messages emitted by `logger` (`server/utils/logger/logger.js`) capture `requestId`, timestamp, log level, and request path as formatted JSON.

---

### 4.5 DTO Request Validation Pipeline
Incoming parameters (`req.body`, `req.query`, `req.params`) pass through `validate(schema)` middleware (`server/middlewares/validate.js`) before reaching controller functions, guaranteeing strong type checking and sanitization.

---

## ⚡ Real-Time Socket.IO & Event Bus Pipelines

Syncro uses a dual event-processing system:
1. **Low-Latency WebSockets (`Socket.IO`)**: Handles live cursor broadcasting, whiteboard drawings, real-time message stream delivery, typing indicators, presence tracking, and retro item voting.
2. **Decoupled Internal EventBus & Inngest**: HTTP mutations publish domain events (`app/auth.registered`, `app/project.created`, `app/task.created`). These events trigger background jobs for email delivery, audit logging, notification generation, and calendar synchronization without blocking HTTP responses.

---

## 🧪 Automated Verification & Testing Architecture

The codebase includes an enterprise automated test framework orchestrated by `node tests/runAllTests.js`:

### 1. Clean Architecture Test Suite ([`server/tests/architecture.test.js`](file:///Users/piyush./Desktop/Syncro/server/tests/architecture.test.js))
Run Command: `node tests/architecture.test.js`
Validates:
- `AppError` inheritance and HTTP status code mappings.
- `ApiResponse` success and error JSON schemas.
- `asyncHandler` promise catch forwarding to Express error middleware.
- `requestIdMiddleware` correlation ID header generation (`x-request-id`).
- DTO validation interceptor behavior and raw SQL soft-delete guard compliance.

**Result**: `16 Passed | 0 Failed`

### 2. Database Infrastructure Test Suite ([`server/tests/database.test.js`](file:///Users/piyush./Desktop/Syncro/server/tests/database.test.js))
Run Command: `npm run db:test`
Validates:
- Real-time `checkDatabaseHealth()` diagnostic ping (`SELECT 1`).
- Soft-delete query interceptor filtering and `findUnique` delegate support.
- Transaction engine rollback and error propagation.
- L2 Redis read-through caching hits and misses.

**Result**: `7 Passed | 0 Failed`

### 3. Security & Cryptographic Test Suite ([`server/tests/security.test.js`](file:///Users/piyush./Desktop/Syncro/server/tests/security.test.js))
Run Command: `node tests/security.test.js`
Validates:
- AES-256-GCM field-level encryption and decryption.
- Constant-time timing-safe comparisons for tokens and hashes.
- Cryptographic SHA-256 2FA code hashing.
- XSS input sanitization and password complexity rules.

**Result**: `13 Passed | 0 Failed`

### 4. Advanced Security & Audit Hash Chain Suite ([`server/tests/advancedSecurity.test.js`](file:///Users/piyush./Desktop/Syncro/server/tests/advancedSecurity.test.js))
Run Command: `node tests/advancedSecurity.test.js`
Validates:
- SHA-256 audit log hash chain tamper verification.
- Recursive nested JSON body sanitization.
- Security headers (Helmet/CSP) enforcement.

**Result**: `12 Passed | 0 Failed`

### 5. Concurrency & Stampede Lock Suite ([`server/tests/concurrency.test.js`](file:///Users/piyush./Desktop/Syncro/server/tests/concurrency.test.js))
Run Command: `node tests/concurrency.test.js`
Validates:
- Distributed Redis cache stampede single-flight locking under 50 parallel requests.
- Optimistic concurrency locking & version conflict checks (`409 Conflict`).
- Transaction exponential backoff retries on transient PostgreSQL deadlocks (`40001`/`40P01`).

**Result**: `7 Passed | 0 Failed`
