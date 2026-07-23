import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import { startRecurrenceScheduler } from './services/recurrenceScheduler.js'
import { serve } from 'inngest/express'
import { inngest, functions } from './inngest/index.js'
import authRouter from './routes/authRoutes.js'
import workspaceRouter from './routes/workspaceRoutes.js'
import { protect } from './middlewares/authMiddleware.js'
import projectRouter from './routes/projectRoutes.js'
import { taskRouter } from './routes/taskRoutes.js'
import commentRouter from './routes/commentRoutes.js'
import chatRouter from './routes/chatRoutes.js'
const app = express()

const allowedOrigins = [
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(url => url.trim()) : []),
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean)

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
      return
    }

    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}

app.use(cors(corsOptions))
app.options(/(.*)/, cors(corsOptions))

app.use(express.json());

app.use('/api/inngest', serve({ client: inngest, functions }))
app.use('/api/auth', authRouter)

//Routes
app.use('/api/workspaces', protect, workspaceRouter)
app.use('/api/projects', protect, projectRouter)
app.use('/api/tasks', protect, taskRouter)
app.use('/api/comments', protect, commentRouter)
app.use('/api/chat', protect, chatRouter)

app.get('/', (req, res) => res.send("Server is live"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`server is running on http://localhost:${PORT}`);
    startRecurrenceScheduler();
});