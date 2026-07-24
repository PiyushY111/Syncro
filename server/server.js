import dns from 'dns'
dns.setDefaultResultOrder('ipv4first')

import dotenv from 'dotenv'
dotenv.config()

if (!process.env.JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET environment variable is missing!");
    process.exit(1);
}

import express from 'express'
import cors from 'cors'
import { serve } from 'inngest/express'
import { inngest, functions } from './inngest/index.js'
import authRouter from './routes/authRoutes.js'
import workspaceRouter from './routes/workspaceRoutes.js'
import { protect } from './middlewares/authMiddleware.js'
import projectRouter from './routes/projectRoutes.js'
import { taskRouter } from './routes/taskRoutes.js'
import commentRouter from './routes/commentRoutes.js'
import chatRouter from './routes/chatRoutes.js'
import meetingRouter from './routes/meetingRoutes.js'
import googleCalendarRouter from './routes/googleCalendarRoutes.js'
const app = express()

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
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
};

app.use(cors(corsOptions));
app.options(/(.*)/, cors(corsOptions));

app.use(express.json());

app.use('/api/inngest', serve({ client: inngest, functions }));
app.use('/api/auth', authRouter);

// Routes
app.use('/api/workspaces', protect, workspaceRouter);
app.use('/api/projects', protect, projectRouter);
app.use('/api/tasks', protect, taskRouter);
app.use('/api/comments', protect, commentRouter);
app.use('/api/chat', protect, chatRouter);
app.use('/api/meetings', protect, meetingRouter);
app.use('/api/google-calendar', googleCalendarRouter);

app.get('/', (req, res) => res.json({ message: "Server is live", status: "OK" }));

// Global Express Error Middleware
app.use((err, req, res, next) => {
    console.error('[EXPRESS ERROR]', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : undefined
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`server is running on http://localhost:${PORT}`);
});