import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const rawConnectionString = process.env.DATABASE_URL
if (!rawConnectionString) {
  throw new Error('DATABASE_URL must be set in environment variables')
}

// Enforce connection pool limits and timeouts to prevent Neon connection exhaustion at scale
let connectionString = rawConnectionString
const paramsToAdd = []
if (!/connection_limit=\d+/.test(connectionString)) {
  const limit = process.env.PRISMA_CONNECTION_LIMIT || '10'
  paramsToAdd.push(`connection_limit=${limit}`)
}
if (!/pool_timeout=\d+/.test(connectionString)) {
  const timeout = process.env.PRISMA_POOL_TIMEOUT || '15'
  paramsToAdd.push(`pool_timeout=${timeout}`)
}
if (!/pgbouncer=true/.test(connectionString) && connectionString.includes('-pooler')) {
  paramsToAdd.push('pgbouncer=true')
}

if (paramsToAdd.length > 0) {
  const separator = connectionString.includes('?') ? '&' : '?'
  connectionString = `${connectionString}${separator}${paramsToAdd.join('&')}`
}

const SLOW_QUERY_THRESHOLD_MS = Number(process.env.SLOW_QUERY_THRESHOLD_MS) || 1000

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

          if (operation === 'delete') {
            const modelName = model.charAt(0).toLowerCase() + model.slice(1)
            // Convert hard delete to soft-delete update
            const result = await basePrisma[modelName].update({
              where: args.where,
              data: { deletedAt: new Date() },
            })
            const duration = performance.now() - start
            if (duration >= SLOW_QUERY_THRESHOLD_MS) {
              console.warn(`[SLOW DB QUERY ALERT] Model: ${model} | Operation: ${operation} | Duration: ${duration.toFixed(2)}ms`)
            }
            return result
          }

          const readOps = ['findMany', 'findFirst', 'findFirstOrThrow', 'count', 'aggregate', 'groupBy']
          const writeOps = ['updateMany', 'upsert', 'deleteMany']

          if (readOps.includes(operation) || writeOps.includes(operation)) {
            // Only add default deletedAt: null filter if deletedAt is not explicitly specified
            if (args.where && args.where.deletedAt === undefined) {
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
