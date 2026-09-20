import { prisma, basePrisma } from "../../config/prisma.js";
import { redisCache } from "../../config/redis.js";
import { logAuditEvent } from "../auditLogger.js";

/**
 * Executes a transactional database operation with exponential backoff retries for transient deadlock/serialization failures.
 *
 * @param {Function} actionFn - Transaction callback function receiving tx client
 * @param {Object} options - Configuration options
 * @param {number} [options.maxRetries=3] - Maximum retry attempts
 * @param {number} [options.timeout=10000] - Transaction timeout in milliseconds
 * @returns {Promise<any>} Result of the transaction action function
 */
export const executeTransaction = async (actionFn, options = {}) => {
  const { maxRetries = 3, timeout = 10000, isolationLevel } = options;
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    try {
      return await prisma.$transaction(
        async (tx) => {
          return await actionFn(tx);
        },
        {
          timeout,
          ...(isolationLevel ? { isolationLevel } : {}),
        }
      );
    } catch (error) {
      const isTransient =
        error.code === "P2034" || // Transaction failed due to write conflict or deadlock
        error.code === "40001" || // Serialization failure
        error.code === "40P01" || // Deadlock detected
        error.message?.includes("deadlock") ||
        error.message?.includes("serialization");

      if (isTransient && attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 100 + Math.floor(Math.random() * 50);
        console.warn(
          `[TRANSACTION RETRY] Attempt ${attempt}/${maxRetries} failed due to transient error (${error.code || error.message}). Retrying in ${backoffMs}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      } else {
        throw error;
      }
    }
  }
};

/**
 * Low-latency real-time database health monitoring diagnostic function.
 * Evaluates DB connectivity, latency ping, active connection capabilities, and returns metrics.
 *
 * @returns {Promise<Object>} Structured database health report
 */
export const checkDatabaseHealth = async () => {
  const startMs = performance.now();
  try {
    // Perform raw SQL ping
    await basePrisma.$queryRawUnsafe("SELECT 1;");
    const latencyMs = Math.round(performance.now() - startMs);

    return {
      status: "HEALTHY",
      database: "PostgreSQL",
      driver: "Prisma Client",
      latencyMs,
      timestamp: new Date().toISOString(),
      details: {
        ping: "OK",
        slowQueryThresholdMs: Number(process.env.SLOW_QUERY_THRESHOLD_MS) || 150,
      },
    };
  } catch (error) {
    const latencyMs = Math.round(performance.now() - startMs);
    return {
      status: "UNHEALTHY",
      database: "PostgreSQL",
      latencyMs,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV !== "production" && { error: error.message }),
    };
  }
};

/**
 * Standardized soft-delete helper that marks an entity as deleted and generates audit log entry.
 *
 * @param {string} modelName - Prisma model name (e.g. 'Project', 'Task')
 * @param {string} entityId - Primary key string of the entity
 * @param {Object} context - Execution context containing workspaceId, userId, entityName
 */
export const softDeleteEntity = async (modelName, entityId, context = {}) => {
  const { workspaceId, userId, entityName = "", req } = context;

  return await executeTransaction(async (tx) => {
    const lowerModel = modelName.toLowerCase();
    const existing = await tx[lowerModel].findUnique({
      where: { id: entityId },
    });

    if (!existing) {
      throw new Error(`${modelName} with ID ${entityId} not found`);
    }

    const updated = await tx[lowerModel].update({
      where: { id: entityId },
      data: { deletedAt: new Date() },
    });

    if (workspaceId && userId) {
      await logAuditEvent({
        workspaceId,
        userId,
        action: "DELETE",
        entityType: modelName.toUpperCase(),
        entityId,
        entityName: entityName || existing.name || existing.title || entityId,
        severity: "CRITICAL",
        previousState: existing,
        newState: updated,
        req,
      });
    }

    // Invalidate cached entity data
    if (workspaceId) {
      await redisCache.invalidateCache(`workspace:${workspaceId}:${lowerModel}:${entityId}`);
      await redisCache.del(`workspace:${workspaceId}:dashboard`);
    }

    return updated;
  });
};

/**
 * Read-through L2 caching wrapper combining Redis cache and Prisma fallback with Distributed Lock Stampede Protection.
 *
 * @param {string} cacheKey - Redis key identifier
 * @param {Function} fetchFn - Async function returning fresh data if cache miss
 * @param {number} [ttlSeconds=300] - Cache time-to-live in seconds
 */
export const getCachedOrFetch = async (cacheKey, fetchFn, ttlSeconds = 300) => {
  try {
    const cached = await redisCache.get(cacheKey);
    if (cached) {
      return typeof cached === "string" ? JSON.parse(cached) : cached;
    }
  } catch (err) {
    console.warn(`[CACHE READ ERROR] Key: ${cacheKey}`, err.message);
  }

  const lockKey = `lock:${cacheKey}`;
  const gotLock = await redisCache.setNx(lockKey, "1", 10);

  if (!gotLock) {
    // Another concurrent process is fetching - poll cache up to 5 times (total ~300ms) before dogpiling DB
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => setTimeout(r, 60));
      try {
        const retry = await redisCache.get(cacheKey);
        if (retry) {
          return typeof retry === "string" ? JSON.parse(retry) : retry;
        }
      } catch {}
    }
  }

  try {
    const freshData = await fetchFn();

    if (freshData !== null && freshData !== undefined) {
      try {
        await redisCache.set(cacheKey, JSON.stringify(freshData), ttlSeconds);
      } catch (err) {
        console.warn(`[CACHE WRITE ERROR] Key: ${cacheKey}`, err.message);
      }
    }

    return freshData;
  } finally {
    if (gotLock) {
      await redisCache.del(lockKey);
    }
  }
};

export default {
  executeTransaction,
  checkDatabaseHealth,
  softDeleteEntity,
  getCachedOrFetch,
};
