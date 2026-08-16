import dns from 'dns'
dns.setDefaultResultOrder('ipv4first')

import dotenv from 'dotenv'
dotenv.config()

if (!process.env.JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET environment variable is missing!");
    process.exit(1);
}

import http from 'http'
import express from 'express'
import cors from 'cors'
import { initSocketIO } from './socket/socketInit.js'
import { serve } from 'inngest/express'
import { inngest, functions } from './inngest/index.js'
import authRouter from './routes/authRoutes.js'
import workspaceRouter from './routes/workspaceRoutes.js'
import { protect } from './middlewares/authMiddleware.js'
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
import { checkDatabaseHealth } from './services/db/dbService.js'
import { basePrisma } from './config/prisma.js'
import cookieParser from 'cookie-parser'
import { requestIdMiddleware } from './middlewares/requestIdMiddleware.js'
import { errorMiddleware } from './middlewares/errorMiddleware.js'
import { metricsMiddleware, getPrometheusMetrics } from './middlewares/metricsMiddleware.js'
import { configureSecurityHeaders } from './middlewares/securityHeaders.js'
import { sanitizeRequestBody } from './middlewares/sanitize.js'

const app = express()

// 1. Configure Helmet Security Headers (CSP, HSTS, X-Frame-Options, XSS Filter)
app.use(configureSecurityHeaders())
app.use(cookieParser())

const allowedOrigins = [
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(url => url.trim().replace(/\/$/, '')) : []),
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean)

process.on('uncaughtException', (err) => {
    console.error('[UNCAUGHT EXCEPTION]', err);
});

process.on('unhandledRejection', (reason) => {
    console.error('[UNHANDLED REJECTION]', reason);
});

const corsOptions = {
  origin: (origin, callback) => {
    const normalizedOrigin = origin ? origin.replace(/\/$/, '') : '';
    if (!origin || allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Workspace-ID'],
};

app.use(cors(corsOptions));
app.options(/(.*)/, cors(corsOptions));

// 2. Strict Payload Limits & Server-Side XSS Input Sanitization
app.use(express.json({ limit: '100kb' }));
app.use(sanitizeRequestBody);
app.use(requestIdMiddleware);
app.use(metricsMiddleware);

app.get('/metrics', getPrometheusMetrics);

app.use('/api/inngest', serve({ client: inngest, functions }));
app.use('/api/auth', authRouter);

// Routes
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

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);
initSocketIO(httpServer);

httpServer.listen(PORT, () => {
    console.log(`Server and Socket.IO engine running on http://localhost:${PORT}`);
    
    // Render & Cloud Free Tier Keep-Alive Self-Ping Service
    const keepAliveUrl = process.env.RENDER_EXTERNAL_URL || process.env.SERVER_URL || process.env.BACKEND_URL;
    if (keepAliveUrl) {
        const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes
        setInterval(async () => {
            try {
                const endpoint = `${keepAliveUrl.replace(/\/$/, '')}/health`;
                await fetch(endpoint);
                console.log(`[Keep-Alive Ping] Pinged ${endpoint} at ${new Date().toISOString()}`);
            } catch (err) {
                console.error(`[Keep-Alive Ping Error]`, err.message);
            }
        }, PING_INTERVAL);
        console.log(`[Keep-Alive Service] Active. Self-pinging ${keepAliveUrl}/health every 10 minutes.`);
    }
});

// Graceful Shutdown Handler for Zero-Downtime Connection Cleanup
const gracefulShutdown = async (signal) => {
    console.log(`[SERVER SHUTDOWN] Received ${signal}. Draining in-flight HTTP requests & database connections cleanly...`);
    httpServer.close(async () => {
        console.log('[SERVER SHUTDOWN] HTTP server stopped accepting new connections.');
        try {
            await basePrisma.$disconnect();
            console.log('[SERVER SHUTDOWN] Database connections closed successfully.');
        } catch (err) {
            console.error('[SERVER SHUTDOWN ERROR]', err);
        }
        process.exit(0);
    });

    // Forceful exit fallback after 10 seconds timeout
    setTimeout(() => {
        console.error('[SERVER SHUTDOWN TIMEOUT] Forcefully terminating process after 10s.');
        process.exit(1);
    }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));