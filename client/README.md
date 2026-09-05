# 💻 Syncro Frontend Client (`client/`)

Welcome to the **Syncro Frontend Client** — an enterprise-grade, high-performance Single Page Application (SPA) built with **React 19**, **Vite**, **Tailwind CSS 4**, and **Redux Toolkit**.

The frontend provides real-time team collaboration, smart kanban boards, infinite-canvas whiteboards, threaded channel chat, agile sprint & retrospective planning, audit logging, and Google Calendar synchronization, secured by the zero-trust **Syncro Shield Cryptographic Engine**.

---

## 📑 Table of Contents

1. [Key Architectural Highlights](#-key-architectural-highlights)
2. [Tech Stack](#-tech-stack)
3. [Zero-Trust Shield Cryptography (Client-Side)](#-zero-trust-shield-cryptography-client-side)
4. [Route-Level Code-Splitting & Performance](#-route-level-code-splitting--performance)
5. [Directory & Component Layout](#-directory--component-layout)
6. [State Management & Data Flow](#-state-management--data-flow)
7. [Environment Variables](#-environment-variables)
8. [Development & Build Commands](#-development--build-commands)

---

## ⚡ Key Architectural Highlights

* **Zero Plaintext Wire Cloaking**: All API requests and responses are encrypted using authenticated **AES-256-GCM** via the W3C WebCrypto API. Browser DevTools Network inspection reveals zero raw endpoints, parameters, or JSON payloads.
* **Unified Cloaked Gateway (`POST /api/v2/shield/dispatch`)**: Transparent Axios interceptor converts standard REST calls (`api.get('/api/tasks')`) into encrypted payloads dispatched to a single gateway endpoint.
* **Dynamic Route Code-Splitting**: Routes are chunked using `React.lazy()` and `<Suspense>`, achieving a **65.2% reduction in initial bundle size** (1.63 MB down to 566 kB) and reducing dev module requests from 504 to ~30.
* **Production-Scoped PWA Resilience**: Progressive Web App service worker intercepts GET queries and caches offline assets exclusively in production, preventing interference with Vite hot-reloading during development.
* **Dual Real-Time Engines**: Seamless live cursor vector whiteboards, presence tracking, and instant channel messaging powered by low-latency Socket.IO state machines.

---

## 🛠️ Tech Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Framework** | [React 19](https://react.dev/) | React Server Components ready, `use()`, `Suspense`, `lazy` |
| **Build Tool** | [Vite 6](https://vitejs.dev/) | Sub-millisecond HMR, Rollup optimized code-splitting |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) | Next-generation CSS engine, dark mode theme support |
| **State Store** | [Redux Toolkit](https://redux-toolkit.js.org/) | Slices for workspace state, theme, unwrapped API contracts |
| **Contexts** | React Context API | `AuthContext` (JWT + MFA), `SocketContext` (real-time events) |
| **HTTP Client** | [Axios](https://axios-http.com/) | Custom interceptor pipeline for transparent Shield payload cloaking |
| **Cryptography** | [WebCrypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) | Hardware-accelerated ECDH P-256, HKDF-SHA256, AES-256-GCM, HMAC |
| **Icons & UI** | Lucide React | Modern, accessible stroke vector icons |
| **Canvas Engine**| HTML5 Canvas API | Vector-based multi-user interactive whiteboard engine |
| **Offline PWA** | Custom Service Worker | Stale-while-revalidate GET response cache (production only) |

---

## 🛡️ Zero-Trust Shield Cryptography (Client-Side)

The client implements client-side cryptographic cloaking via two core modules in `src/utils/`:

### 1. `shieldCrypto.js` (WebCrypto Cryptographic Primitives)
- **ECDH Key Agreement**: Generates ephemeral NIST `P-256` keypairs using `window.crypto.subtle.generateKey`.
- **HKDF-SHA256 Derivation**: Computes shared Diffie-Hellman secret with server public key, deriving:
  - `K_enc` (AES-256-GCM 256-bit encryption key)
  - `K_auth` (HMAC-SHA256 256-bit authentication key)
- **AES-256-GCM Envelope Encryption**: Encrypts payload objects with unique 96-bit random IVs and 128-bit authentication tags, injecting randomized anti-traffic-analysis jitter padding (16-64 bytes).
- **HMAC-SHA256 Signatures**: Computes tamper-proof message signatures over `${timestamp}:${nonce}:${payload}`.

### 2. `shieldSession.js` (Session & Nonce Orchestration)
- Handles handshake negotiation with `POST /api/v2/shield/handshake`.
- Caches the derived session key in memory with automatic rotation on 24-hour expiration.
- Generates cryptographically secure 128-bit atomic nonces and epoch timestamps for anti-replay defense.

### 3. Transparent Axios Interceptors (`src/configs/api.js`)
Application developers write conventional Axios calls:
```javascript
import api from '@/configs/api';

// Cloaked automatically behind POST /api/v2/shield/dispatch
const { data } = await api.get('/api/tasks');
```
1. **Request Interceptor**: Encrypts `{ method, endpoint, headers, body }`, computes HMAC signature and anti-replay headers, and retargets the request to `POST /api/v2/shield/dispatch`.
2. **Response Interceptor**: Intercepts `{ __enc: true, payload }` responses, uncloaks the ciphertext using the session key, and unwraps the resulting JSON directly into `response.data`.

---

## ⚡ Route-Level Code-Splitting & Performance

To prevent initial page load stalls, all top-level routes in `src/App.jsx` are dynamically loaded using `React.lazy()`:

```jsx
// src/App.jsx
import React, { Suspense, lazy } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Chat = lazy(() => import('./pages/Chat'));
const Whiteboard = lazy(() => import('./pages/Whiteboard'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Sprints = lazy(() => import('./pages/Sprints'));
const Retrospectives = lazy(() => import('./pages/Retrospectives'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Milestones = lazy(() => import('./pages/Milestones'));
```

### Performance Metrics
- **Initial Vendor Bundle**: Reduced by **65.2%** from 1,629 kB to **566 kB**.
- **Initial Dev HTTP Requests**: Reduced by **94%** from 504 to **~30 requests**.
- **On-Demand Route Chunks**:
  - `Chat`: 63.3 kB
  - `Calendar`: 54.1 kB
  - `Whiteboard`: 43.8 kB
  - `Dashboard`: 39.2 kB
  - `Sprints / Retros`: 28.5 kB

---

## 📂 Directory & Component Layout

```text
client/
├── public/
│   ├── favicon.ico
│   └── service-worker.js         # Production PWA caching interceptor
├── src/
│   ├── app/                      # Redux store root
│   │   └── store.js
│   ├── assets/                   # Static icons, dummy images & logos
│   ├── components/               # Presentational domain UI components
│   │   ├── audit/                # Audit logs, diff comparison modal, metrics
│   │   ├── auth/                 # Sign-in forms, MFA 2FA verification dialog
│   │   ├── calendar/             # Interactive schedule calendar, meeting dialogs
│   │   ├── chat/                 # Channel sidebars, message streams, thread panels
│   │   ├── common/               # Shared modals & confirmation dialogs
│   │   ├── dashboard/            # Workspace stats, activity feed, scratchpad
│   │   ├── inbox/                # Universal Inbox notifications feed
│   │   ├── layout/               # App layout shell, navigation bar, sidebar
│   │   ├── ownerAudit/           # Security command center & log purge tools
│   │   ├── portfolio/            # Multi-project portfolio dashboards
│   │   ├── project/              # Kanban board, Gantt, Scrum, Whiteboard components
│   │   ├── roles/                # RBAC permission matrix & custom role creator
│   │   ├── settings/             # User profile, password, workspace settings
│   │   ├── task/                 # Task modal dialogs, comments feed, selectors
│   │   └── workspace/            # Team onboarding, invite links, sub-team management
│   ├── configs/
│   │   └── api.js                # Axios client with Shield encryption interceptor
│   ├── context/
│   │   ├── AuthContext.jsx       # Auth user state, JWT tokens, 2FA verification
│   │   └── SocketContext.jsx     # Live Socket.IO real-time connection state
│   ├── features/
│   │   ├── themeSlice.js         # Theme switching state (dark / light mode)
│   │   ├── workspaceHelpers.js   # RBAC permission evaluation utilities
│   │   └── workspaceSlice.js     # Active workspace and member roster
│   ├── hooks/
│   │   ├── useChat.js            # Chat connection & message orchestration
│   │   ├── useChatChannels.js    # Channel subscriptions
│   │   ├── useChatMessages.js    # Infinite scroll message fetching
│   │   └── useWorkspaceSettings.js # Workspace metadata mutations
│   ├── pages/                    # Dynamic lazy-loaded route containers
│   ├── utils/
│   │   ├── permissions.js        # Dynamic client-side role checker
│   │   ├── shieldCrypto.js       # Client WebCrypto ECDH / AES-256-GCM / HMAC
│   │   └── shieldSession.js      # Session management & atomic nonce generator
│   ├── App.jsx                   # Route dispatcher with Suspense fallback
│   ├── index.css                 # Tailwind CSS 4 theme rules
│   └── main.jsx                  # React DOM mounting & conditional SW registration
├── .env.example                  # Environment blueprint
├── index.html                    # Single Page Application HTML shell
├── jsconfig.json                 # Path alias resolution (@/* -> src/*)
├── package.json
└── vite.config.js                # Vite build and dev server configuration
```

---

## 🔄 State Management & Data Flow

1. **Authentication State (`AuthContext`)**:
   - Manages user login, registration, and 6-digit email 2FA verification.
   - Automatically resets verification state when navigating back to login screens.
   - Stores JWT credentials in memory and persistent storage.
2. **Workspace & Role State (`workspaceSlice`)**:
   - Maintains active workspace context, member lists, and role matrix rules.
   - Unwraps standard `ApiResponse` envelopes (`const payload = res.data?.data || res.data`).
3. **Real-Time WebSocket State (`SocketContext`)**:
   - Maintains a single persistent Socket.IO connection authenticated via JWT.
   - Subscribes to channel rooms, cursor movement channels, and retro boards.

---

## ⚙️ Environment Variables

Create a `.env` file in the `client/` root based on `.env.example`:

```env
# Backend API Base URL
VITE_API_URL=http://localhost:5000

# Backend Socket.IO Server URL
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🚀 Development & Build Commands

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```
Runs Vite on [http://localhost:5173](http://localhost:5173) with sub-second HMR. Service workers are automatically disabled in development mode.

### Production Build
```bash
npm run build
```
Compiles and tree-shakes the application using Rollup with isolated dynamic route chunks under `client/dist/`.

### Preview Production Build
```bash
npm run preview
```
Spins up a local web server to test the production build with active Service Worker PWA caching.

### Linting
```bash
npm run lint
```
Checks code quality using ESLint.

