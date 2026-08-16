import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL must be set in environment variables')
}

const SLOW_QUERY_THRESHOLD_MS = Number(process.env.SLOW_QUERY_THRESHOLD_MS) || 150

// Base Prisma Client with logging configuration
export const basePrisma = new PrismaClient({
  datasources: {
    db: {
      url: connectionString,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

// Models that support soft deletion
const SOFT_DELETE_MODELS = new Set(['User', 'Workspace', 'Project', 'Task'])

// Enhanced Enterprise Prisma Client with Extensions ($extends)
export const prisma = basePrisma.$extends({
  name: 'EnterpriseDatabaseExtensions',
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const start = performance.now()

        // 1. Soft-delete automatic filter interceptor
        if (model && SOFT_DELETE_MODELS.has(model)) {
          args = args || {}
          args.where = args.where || {}

          if (operation === 'findUnique' || operation === 'findUniqueOrThrow') {
            const modelName = model.charAt(0).toLowerCase() + model.slice(1)
            const targetMethod = operation === 'findUnique' ? 'findFirst' : 'findFirstOrThrow'
            const where = { ...args.where }
            if (where.deletedAt === undefined) {
              where.deletedAt = null
            }
            const result = await basePrisma[modelName][targetMethod]({ ...args, where })
            const duration = performance.now() - start
            if (duration >= SLOW_QUERY_THRESHOLD_MS) {
              console.warn(
                `[SLOW DB QUERY ALERT] Model: ${model} | Operation: ${operation} | Duration: ${duration.toFixed(2)}ms`
              )
            }
            return result
          }

          const readOps = ['findMany', 'findFirst', 'findFirstOrThrow', 'count', 'aggregate', 'groupBy']
          const writeOps = ['update', 'updateMany', 'upsert', 'delete', 'deleteMany']

          if (readOps.includes(operation) || writeOps.includes(operation)) {
            // Only add default deletedAt: null filter if deletedAt is not explicitly specified
            if (args.where.deletedAt === undefined) {
              args.where.deletedAt = null
            }
          }
        }

        // 2. Execute query
        const result = await query(args)
        const duration = performance.now() - start

        // 3. Telemetry & Slow Query Diagnostics
        if (duration >= SLOW_QUERY_THRESHOLD_MS) {
          console.warn(
            `[SLOW DB QUERY ALERT] Model: ${model || 'Raw'} | Operation: ${operation} | Duration: ${duration.toFixed(2)}ms`
          )
        }

        return result
      },
    },
  },
})

export default prisma
