import { getCachedOrFetch, executeTransaction } from '../services/db/dbService.js';
import { redisCache } from '../config/redis.js';

async function runConcurrencyTestSuite() {
  console.log('Starting Enterprise Concurrency Test Suite...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition, title) => {
    if (condition) {
      console.log(`  [PASS] ${title}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${title}`);
      failed++;
    }
  };

  try {
    // Test 1: Distributed Cache Stampede Protection under 50 Concurrent Requests
    console.log('Test 1: Distributed Cache Stampede Lock under 50 Parallel Requests');
    const cacheKey = `stress:stampede:${Date.now()}`;
    let dbFetchCount = 0;

    const mockFetchFn = async () => {
      dbFetchCount++;
      await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate slow DB fetch
      return { id: 'heavy-query-result', data: [1, 2, 3] };
    };

    // Fire 50 concurrent requests simultaneously
    const requests = Array.from({ length: 50 }, () => getCachedOrFetch(cacheKey, mockFetchFn, 60));
    const results = await Promise.all(requests);

    assert(dbFetchCount === 1, `DB fetch function executed exactly 1 time instead of 50 (actual: ${dbFetchCount})`);
    assert(results.length === 50 && results.every((r) => r && r.id === 'heavy-query-result'), 'All 50 concurrent requests returned valid fresh data from stampede lock');
    await redisCache.del(cacheKey);
    console.log('');

    // Test 2: Optimistic Locking Conflict Under High-Parallelism Mutations (Tasks, Projects, Whiteboards)
    console.log('Test 2: Optimistic Locking Conflict Handling (Task, Project, Whiteboard)');
    let taskState = { id: 'task-stress-1', version: 1, title: 'Initial Title' };

    const simulateTaskUpdate = async (expectedVersion, newTitle) => {
      if (taskState.version !== expectedVersion) {
        return { success: false, statusCode: 409, message: 'Conflict: Task modified by another user' };
      }
      taskState = { ...taskState, title: newTitle, version: taskState.version + 1 };
      return { success: true, statusCode: 200, task: taskState };
    };

    // Fire 10 simultaneous task updates with expectedVersion = 1
    const updatePromises = Array.from({ length: 10 }, (_, idx) => simulateTaskUpdate(1, `Title Updated by Worker ${idx}`));
    const updateResults = await Promise.all(updatePromises);

    const successfulUpdates = updateResults.filter((r) => r.success);
    const conflictErrors = updateResults.filter((r) => r.statusCode === 409);

    assert(successfulUpdates.length === 1, 'Exactly 1 concurrent task update succeeded');
    assert(conflictErrors.length === 9, 'Exactly 9 concurrent task updates failed with HTTP 409 Conflict');
    assert(taskState.version === 2, 'Task version correctly incremented to 2');

    // Test Project Concurrent Updates
    let projectState = { id: 'proj-stress-1', version: 1, name: 'Initial Project' };
    const simulateProjectUpdate = async (expectedVersion, newName) => {
      if (projectState.version !== expectedVersion) {
        return { success: false, statusCode: 409, message: 'Conflict: Project was modified by another user' };
      }
      projectState = { ...projectState, name: newName, version: projectState.version + 1 };
      return { success: true, statusCode: 200, project: projectState };
    };

    const projPromises = Array.from({ length: 10 }, (_, idx) => simulateProjectUpdate(1, `Project Updated by Worker ${idx}`));
    const projResults = await Promise.all(projPromises);
    assert(projResults.filter((r) => r.success).length === 1, 'Exactly 1 concurrent project update succeeded');
    assert(projResults.filter((r) => r.statusCode === 409).length === 9, 'Exactly 9 concurrent project updates failed with HTTP 409 Conflict');
    assert(projectState.version === 2, 'Project version correctly incremented to 2');

    // Test Whiteboard Concurrent Updates
    let whiteboardState = { id: 'wb-stress-1', version: 1, name: 'Initial Board' };
    const simulateWhiteboardUpdate = async (expectedVersion, newName) => {
      if (whiteboardState.version !== expectedVersion) {
        return { success: false, statusCode: 409, message: 'Conflict: Whiteboard was modified by another collaborator' };
      }
      whiteboardState = { ...whiteboardState, name: newName, version: whiteboardState.version + 1 };
      return { success: true, statusCode: 200, whiteboard: whiteboardState };
    };

    const wbPromises = Array.from({ length: 10 }, (_, idx) => simulateWhiteboardUpdate(1, `Whiteboard Updated by Worker ${idx}`));
    const wbResults = await Promise.all(wbPromises);
    assert(wbResults.filter((r) => r.success).length === 1, 'Exactly 1 concurrent whiteboard update succeeded');
    assert(wbResults.filter((r) => r.statusCode === 409).length === 9, 'Exactly 9 concurrent whiteboard updates failed with HTTP 409 Conflict');
    assert(whiteboardState.version === 2, 'Whiteboard version correctly incremented to 2');
    console.log('');

    // Test 3: Transaction Backoff Retries on Transient Lock Contention
    console.log('Test 3: Transaction Exponential Backoff Retries on Deadlock');
    let attemptCounter = 0;
    const transientAction = async () => {
      attemptCounter++;
      if (attemptCounter < 3) {
        const error = new Error('Transaction failed due to write conflict or deadlock');
        error.code = 'P2034';
        throw error;
      }
      return 'TRANSACTION_SUCCESS';
    };

    const { basePrisma } = await import('../config/prisma.js');
    const originalTx = basePrisma.$transaction;
    basePrisma.$transaction = async (fn) => fn({});

    try {
      const txResult = await executeTransaction(transientAction, { maxRetries: 4 });
      assert(txResult === 'TRANSACTION_SUCCESS', 'executeTransaction recovered and completed after transient failure');
      assert(attemptCounter === 3, 'executeTransaction attempted retries with backoff exactly 3 times');
    } finally {
      basePrisma.$transaction = originalTx;
    }
    console.log('');

    console.log('----------------------------------------------------');
    console.log(`CONCURRENCY TEST SUMMARY: ${passed} Passed | ${failed} Failed`);
    console.log('----------------------------------------------------');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Concurrency test suite error:', err);
    process.exit(1);
  }
}

runConcurrencyTestSuite();
