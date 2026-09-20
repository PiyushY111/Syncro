import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { serve } from 'inngest/express'

import logger from './utils/logger/logger.js'
import { protect } from './middlewares/authMiddleware.js'
import { verifyCsrfToken } from './middlewares/csrf.js'
import { isOriginAllowed } from './config/corsPolicy.js'
import { requestIdMiddleware } from './middlewares/requestIdMiddleware.js'
import { errorMiddleware } from './middlewares/errorMiddleware.js'
import { metricsMiddleware, getPrometheusMetrics } from './middlewares/metricsMiddleware.js'
import { configureSecurityHeaders } from './middlewares/securityHeaders.js'
import { sanitizeRequestBody } from './middlewares/sanitize.js'
import { apiLimiter } from './middlewares/rateLimiter.js'

import { inngest, functions } from './inngest/index.js'
import { checkDatabaseHealth } from './services/db/dbService.js'

// Domain Route Modules
import authRouter from './routes/authRoutes.js'
import workspaceRouter from './routes/workspaceRoutes.js'
import projectRouter from './routes/projectRoutes.js'
import { taskRouter } from './routes/taskRoutes.js'
import commentRouter from './routes/commentRoutes.js'
import chatRouter from './routes/chatRoutes.js'
import subTeamRouter from './routes/subTeamRoutes.js'
import meetingRouter from './routes/meetingRoutes.js'
import googleCalendarRouter from './routes/googleCalendarRoutes.js'
import milestoneRouter from './routes/milestoneRoutes.js'
import portfolioRouter from './routes/portfolioRoutes.js'
import inboxRouter from './routes/inboxRoutes.js'
import roleRouter from './routes/roleRoutes.js'
import auditRouter from './routes/auditRoutes.js'
import whiteboardRouter from './routes/whiteboardRoutes.js'
import sprintRouter from './routes/sprintRoutes.js'
import epicRouter from './routes/epicRoutes.js'
import retroRouter from './routes/retroRoutes.js'
import adminRouter from './routes/adminRoutes.js'
import shieldRouter from './routes/shieldRoutes.js'

const app = express()

// 1. Configure Helmet Security Headers (CSP, HSTS, X-Frame-Options, XSS Filter)
app.use(configureSecurityHeaders())
app.use(cookieParser())

const corsOptions = {
  origin: (origin, callback) => {
    callback(null, isOriginAllowed(origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'X-Workspace-ID',
    'x-csrf-token',
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
// verifyCsrfToken guards state-changing cookie-authenticated requests (double-submit CSRF defense).
// It's a no-op for Bearer-token callers, so it's safe to apply globally alongside `protect`.
app.use('/api/workspaces', protect, verifyCsrfToken, workspaceRouter);
app.use('/api/projects', protect, verifyCsrfToken, projectRouter);
app.use('/api/tasks', protect, verifyCsrfToken, taskRouter);
app.use('/api/comments', protect, verifyCsrfToken, commentRouter);
app.use('/api/chat', protect, verifyCsrfToken, chatRouter);
app.use('/api/subteams', protect, verifyCsrfToken, subTeamRouter);
app.use('/api/meetings', protect, verifyCsrfToken, meetingRouter);
app.use('/api/google-calendar', googleCalendarRouter);
app.use('/api/milestones', protect, verifyCsrfToken, milestoneRouter);
app.use('/api/portfolios', protect, verifyCsrfToken, portfolioRouter);
app.use('/api/inbox', protect, verifyCsrfToken, inboxRouter);
app.use('/api/roles', protect, verifyCsrfToken, roleRouter);
app.use('/api/audit', protect, verifyCsrfToken, auditRouter);
app.use('/api/whiteboards', protect, verifyCsrfToken, whiteboardRouter);
app.use('/api/sprints', protect, verifyCsrfToken, sprintRouter);
app.use('/api/epics', protect, verifyCsrfToken, epicRouter);
app.use('/api/retros', protect, verifyCsrfToken, retroRouter);
app.use('/api/admin', verifyCsrfToken, adminRouter);

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
