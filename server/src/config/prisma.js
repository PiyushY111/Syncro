import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { encryptField, decryptField } from '../utils/crypto.js'
import logger from '../utils/logger/logger.js'

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

// Sensitive fields to encrypt at rest in database
const ENCRYPTED_FIELDS_BY_MODEL = {
  User: ['googleAccessToken', 'googleRefreshToken', 'twoFactorCode'],
  Message: ['content'],
  Comment: ['content']
}

const decryptModelObject = (model, obj) => {
  if (!obj || typeof obj !== 'object') return obj
  const fields = ENCRYPTED_FIELDS_BY_MODEL[model]
  if (fields) {
    for (const field of fields) {
      if (typeof obj[field] === 'string' && obj[field].includes(':')) {
        obj[field] = decryptField(obj[field])
      }
    }
  }
  // Recursively decrypt nested relations if present
  if (obj.user && typeof obj.user === 'object') decryptModelObject('User', obj.user)
  if (Array.isArray(obj.comments)) obj.comments.forEach(c => decryptModelObject('Comment', c))
  if (Array.isArray(obj.messages)) obj.messages.forEach(m => decryptModelObject('Message', m))
  if (Array.isArray(obj.replies)) obj.replies.forEach(r => decryptModelObject('Message', r))
  if (obj.comment && typeof obj.comment === 'object') decryptModelObject('Comment', obj.comment)
  if (obj.message && typeof obj.message === 'object') decryptModelObject('Message', obj.message)
  return obj
}

const decryptResults = (model, data) => {
  if (!data) return data
  if (Array.isArray(data)) {
    return data.map(item => decryptModelObject(model, item))
  }
  return decryptModelObject(model, data)
}

const encryptModelData = (model, data) => {
  if (!data || typeof data !== 'object') return data
  const fields = ENCRYPTED_FIELDS_BY_MODEL[model]
  if (!fields) return data
  const copy = { ...data }
  for (const field of fields) {
    if (typeof copy[field] === 'string' && copy[field].length > 0 && !copy[field].includes(':')) {
      copy[field] = encryptField(copy[field])
    }
  }
  return copy
}

// Enhanced Enterprise Prisma Client with Extensions ($extends)
export const prisma = basePrisma.$extends({
  name: 'EnterpriseDatabaseExtensions',
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const start = performance.now()

        // 1. Soft-delete automatic filter interceptor
        if (model && SOFT_DELETE_MODELS.has(model)) {
          if (operation === 'findUnique' || operation === 'findUniqueOrThrow') {
            // Use `query` (not `basePrisma`) so this stays inside the caller's
            // transaction when invoked via `tx.model.findUnique(...)` — the
            // previous implementation called basePrisma directly, which runs
            // on a separate connection outside any open transaction and so
            // can't see that transaction's own uncommitted writes (e.g. a
            // row created earlier in the same $transaction callback).
            // Prisma's extended `where` on findUnique accepts additional
            // non-unique filters alongside the unique key, so the same
            // operation can be reused as-is instead of switching to findFirst.
            const where = { ...(args?.where || {}) }
            if (where.deletedAt === undefined) {
              where.deletedAt = null
            }
            const result = await query({ ...args, where })
            const duration = performance.now() - start
            if (duration >= SLOW_QUERY_THRESHOLD_MS) {
              logger.warn(
                `[SLOW DB QUERY ALERT] Model: ${model} | Operation: ${operation} | Duration: ${duration.toFixed(2)}ms`,
                { model, operation, durationMs: duration }
              )
            }
            return decryptResults(model, result)
          }

          if (operation === 'delete') {
            const modelName = model.charAt(0).toLowerCase() + model.slice(1)
            // Convert hard delete to soft-delete update
            const result = await basePrisma[modelName].update({
              where: args?.where || {},
              data: { deletedAt: new Date() },
            })
            const duration = performance.now() - start
            if (duration >= SLOW_QUERY_THRESHOLD_MS) {
              logger.warn(`[SLOW DB QUERY ALERT] Model: ${model} | Operation: ${operation} | Duration: ${duration.toFixed(2)}ms`, { model, operation, durationMs: duration })
            }
            return result
          }

          if (operation === 'deleteMany') {
            const modelName = model.charAt(0).toLowerCase() + model.slice(1)
            const where = { ...(args?.where || {}) }
            if (where.deletedAt === undefined) {
              where.deletedAt = null
            }
            const result = await basePrisma[modelName].updateMany({
              where,
              data: { deletedAt: new Date() },
            })
            const duration = performance.now() - start
            if (duration >= SLOW_QUERY_THRESHOLD_MS) {
              logger.warn(`[SLOW DB QUERY ALERT] Model: ${model} | Operation: ${operation} | Duration: ${duration.toFixed(2)}ms`, { model, operation, durationMs: duration })
            }
            return result
          }

          const readOps = ['findMany', 'findFirst', 'findFirstOrThrow', 'count', 'aggregate', 'groupBy']
          const writeOps = ['updateMany', 'upsert']

          if (readOps.includes(operation) || writeOps.includes(operation)) {
            args = args || {}
            args.where = args.where || {}
            // Only add default deletedAt: null filter if deletedAt is not explicitly specified
            if (args.where.deletedAt === undefined) {
              args.where.deletedAt = null
            }
          }
        }

        // 2. Sensitive fields encryption for writes
        if (model && ENCRYPTED_FIELDS_BY_MODEL[model]) {
          if (args?.data) args.data = encryptModelData(model, args.data)
          if (args?.create) args.create = encryptModelData(model, args.create)
          if (args?.update) args.update = encryptModelData(model, args.update)
        }

        // 3. Execute query
        const result = await query(args)
        const duration = performance.now() - start

        // 4. Telemetry & Slow Query Diagnostics
        if (duration >= SLOW_QUERY_THRESHOLD_MS) {
          logger.warn(
            `[SLOW DB QUERY ALERT] Model: ${model || 'Raw'} | Operation: ${operation} | Duration: ${duration.toFixed(2)}ms`,
            { model: model || 'Raw', operation, durationMs: duration }
          )
        }

        return decryptResults(model, result)
      },
    },
  },
})

export default prisma
