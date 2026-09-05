import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { serve } from 'inngest/express'

import {
  logger,
  protect,
  requestIdMiddleware,
  errorMiddleware,
  metricsMiddleware,
  getPrometheusMetrics,
  configureSecurityHeaders,
  sanitizeRequestBody,
  apiLimiter,
} from './shared/index.js'

import { inngest, functions, checkDatabaseHealth } from './infra/index.js'

// Domain Routers from Modules
import { authRouter } from './modules/auth/index.js'
import { workspaceRouter } from './modules/workspace/index.js'
import { projectRouter } from './modules/project/index.js'
import { taskRouter } from './modules/task/index.js'
import { commentRouter } from './modules/comment/index.js'
import { chatRouter } from './modules/chat/index.js'
import { subTeamRouter } from './modules/subTeam/index.js'
import { meetingRouter } from './modules/meeting/index.js'
import { googleCalendarRouter } from './modules/googleCalendar/index.js'
import { milestoneRouter } from './modules/milestone/index.js'
import { portfolioRouter } from './modules/portfolio/index.js'
import { inboxRouter } from './modules/inbox/index.js'
import { roleRouter } from './modules/role/index.js'
import { auditRouter } from './modules/audit/index.js'
import { whiteboardRouter } from './modules/whiteboard/index.js'
import { sprintRouter } from './modules/sprint/index.js'
import { epicRouter } from './modules/epic/index.js'
import { retroRouter } from './modules/retro/index.js'
import { adminRouter } from './modules/admin/index.js'
import { shieldRouter } from './modules/shield/index.js'

const app = express()

// 1. Configure Helmet Security Headers (CSP, HSTS, X-Frame-Options, XSS Filter)
app.use(configureSecurityHeaders())
app.use(cookieParser())

const allowedOrigins = [
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(url => url.trim().replace(/\/$/, '')) : []),
  'https://syncro.piyushydv.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

const allowedOriginSuffixes = (process.env.ALLOWED_ORIGIN_SUFFIXES || '.piyushydv.com,piyushydv.com')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    const normalizedOrigin = origin.replace(/\/$/, '').toLowerCase();
    const isAllowed =
      allowedOrigins.includes(normalizedOrigin) ||
      allowedOriginSuffixes.some(suffix => normalizedOrigin.endsWith(suffix));

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'X-Workspace-ID',
    'x-shield-session',
    'x-shield-timestamp',
    'x-shield-nonce',
    'x-shield-sig'
  ],
};

app.use(cors(corsOptions));
app.options(/(.*)/, cors(corsOptions));

// 2. Strict Payload Limits & Server-Side XSS Input Sanitization
app.use(express.json({ limit: '100kb' }));
app.use(sanitizeRequestBody);
app.use(requestIdMiddleware);
app.use(metricsMiddleware);

// Internal telemetry metrics (protected)
app.get('/metrics', protect, getPrometheusMetrics);

// Global API rate limiting
app.use('/api', apiLimiter);

// Unified Cloaked Security Shield Gateway
app.use('/api/v2/shield', shieldRouter);

app.use('/api/inngest', serve({ client: inngest, functions }));
app.use('/api/auth', authRouter);

// Domain Routes
app.use('/api/workspaces', protect, workspaceRouter);
app.use('/api/projects', protect, projectRouter);
app.use('/api/tasks', protect, taskRouter);
app.use('/api/comments', protect, commentRouter);
app.use('/api/chat', protect, chatRouter);
app.use('/api/subteams', protect, subTeamRouter);
app.use('/api/meetings', protect, meetingRouter);
app.use('/api/google-calendar', googleCalendarRouter);
app.use('/api/milestones', protect, milestoneRouter);
app.use('/api/portfolios', protect, portfolioRouter);
app.use('/api/inbox', protect, inboxRouter);
app.use('/api/roles', protect, roleRouter);
app.use('/api/audit', protect, auditRouter);
app.use('/api/whiteboards', protect, whiteboardRouter);
app.use('/api/sprints', protect, sprintRouter);
app.use('/api/epics', protect, epicRouter);
app.use('/api/retros', protect, retroRouter);
app.use('/api/admin', adminRouter);

app.get('/', (req, res) => res.json({ message: "Server is live", status: "OK" }));

app.get(['/health', '/api/ping'], async (req, res) => {
    const dbHealth = await checkDatabaseHealth();
    const isHealthy = dbHealth.status === 'HEALTHY';

    res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? "OK" : "DEGRADED",
        message: isHealthy ? "Server and Database operational" : "Database connectivity issue detected",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
            status: dbHealth.status,
            latencyMs: dbHealth.latencyMs,
        }
    });
});

app.get('/api/health/detailed', protect, async (req, res) => {
    const dbHealth = await checkDatabaseHealth();
    res.status(dbHealth.status === 'HEALTHY' ? 200 : 503).json(dbHealth);
});

// Global Centralized Express Error Middleware
app.use(errorMiddleware);

export { app };
export default app;
