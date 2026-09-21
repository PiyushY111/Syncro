/**
 * ============================================================================
 * TASK CROSS-PROJECT REFERENCE VALIDATION SUITE
 * ============================================================================
 * Regression coverage for the IDOR class of bug where task creation/update
 * accepted sprintId/epicId/milestoneId/dependenciesIds/assigneeId from the
 * client and connected them without checking they belong to the same
 * project as the task. Runs the real controllers (createTask/updateTask)
 * against a local Postgres, with mock req/res/next objects — the same
 * pattern tests/gatekeeper.test.js uses for middleware.
 *
 * Safety: like tests/rlsIsolation.test.js, this suite writes/deletes
 * fixture rows and refuses to run against anything but a local Postgres.
 */

import { PrismaClient } from '@prisma/client';
import { createTask } from '../src/controllers/task/taskCreate.js';
import updateTask from '../src/controllers/task/taskUpdate.js';

let totalTests = 0;
let passedTests = 0;

function it(desc, condition) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✔ ${desc}`);
  } else {
    console.error(`  ✖ ${desc}`);
  }
}

function isLocalDatabaseUrl(urlStr) {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

function mockReqRes(user, body = {}, params = {}) {
  let caughtError = null;
  const req = {
    user,
    body,
    params,
    query: {},
    headers: {},
    socket: {},
    get: () => undefined,
  };
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  const next = (err) => {
    caughtError = err;
  };
  return { req, res, next, getError: () => caughtError };
}

async function run() {
  console.log('\n====================================================');
  console.log('🧪 Running Task Cross-Project Reference Validation Suite');
  console.log('====================================================\n');

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || !isLocalDatabaseUrl(dbUrl)) {
    console.log('  ⚠️  DATABASE_URL is not a local Postgres instance. Skipping (see rlsIsolation.test.js for why).\n');
    console.log('Task Cross-Project Reference Suite: skipped (not a local database)\n');
    process.exit(0);
  }

  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  let lead;
  let stranger;

  try {
    const suffix = Date.now();
    lead = await prisma.user.create({ data: { name: 'Lead', email: `taskref-lead-${suffix}@example.com` } });
    stranger = await prisma.user.create({ data: { name: 'Stranger', email: `taskref-stranger-${suffix}@example.com` } });

    const workspace = await prisma.workspace.create({
      data: { name: 'Task Ref Test WS', slug: `taskref-ws-${suffix}`, ownerId: lead.id },
    });

    const projectA = await prisma.project.create({
      data: { name: 'Project A', team_lead: lead.id, workspaceId: workspace.id },
    });
    const projectB = await prisma.project.create({
      data: { name: 'Project B', team_lead: lead.id, workspaceId: workspace.id },
    });

    const sprintA = await prisma.sprint.create({
      data: { name: 'Sprint A', startDate: new Date(), endDate: new Date(Date.now() + 86400000), projectId: projectA.id },
    });
    const sprintB = await prisma.sprint.create({
      data: { name: 'Sprint B', startDate: new Date(), endDate: new Date(Date.now() + 86400000), projectId: projectB.id },
    });

    const epicA = await prisma.epic.create({ data: { name: 'Epic A', projectId: projectA.id } });
    const epicB = await prisma.epic.create({ data: { name: 'Epic B', projectId: projectB.id } });

    const milestoneA = await prisma.milestone.create({
      data: { title: 'Milestone A', dueDate: new Date(Date.now() + 86400000), projectId: projectA.id },
    });
    const milestoneB = await prisma.milestone.create({
      data: { title: 'Milestone B', dueDate: new Date(Date.now() + 86400000), projectId: projectB.id },
    });

    const taskAInProjectA = await prisma.task.create({ data: { title: 'Existing Task A', projectId: projectA.id } });
    const taskInProjectB = await prisma.task.create({ data: { title: 'Existing Task B', projectId: projectB.id } });

    // --- createTask: foreign references are rejected --------------------
    console.log('1. createTask rejects cross-project references');

    {
      const { req, res, next, getError } = mockReqRes(lead, {
        title: 'New Task', projectId: projectA.id, sprintId: sprintB.id,
      });
      await createTask(req, res, next);
      it('rejects a sprintId belonging to another project', getError()?.errorCode === 'NOT_FOUND');
    }

    {
      const { req, res, next, getError } = mockReqRes(lead, {
        title: 'New Task', projectId: projectA.id, epicId: epicB.id,
      });
      await createTask(req, res, next);
      it('rejects an epicId belonging to another project', getError()?.errorCode === 'NOT_FOUND');
    }

    {
      const { req, res, next, getError } = mockReqRes(lead, {
        title: 'New Task', projectId: projectA.id, dependenciesIds: [taskInProjectB.id],
      });
      await createTask(req, res, next);
      it('rejects a dependency task belonging to another project', getError()?.errorCode === 'NOT_FOUND');
    }

    {
      const { req, res, next, getError } = mockReqRes(lead, {
        title: 'New Task', projectId: projectA.id, assigneeId: stranger.id,
      });
      await createTask(req, res, next);
      it('rejects an assigneeId who is not a member of the project', getError()?.errorCode === 'FORBIDDEN');
    }

    // --- createTask: same-project references still work -----------------
    console.log('\n2. createTask still allows same-project references');
    let createdTaskId;
    {
      const { req, res, next, getError } = mockReqRes(lead, {
        title: 'Valid Task', projectId: projectA.id, sprintId: sprintA.id, epicId: epicA.id,
        dependenciesIds: [taskAInProjectA.id], assigneeId: lead.id,
      });
      await createTask(req, res, next);
      const err = getError();
      const task = res.body?.data?.task;
      createdTaskId = task?.id;
      it('accepts sprintId/epicId/dependenciesIds/assigneeId all from the same project', !err && !!task);
    }

    // --- updateTask: foreign references are rejected ---------------------
    console.log('\n3. updateTask rejects cross-project references');

    {
      const { req, res, next, getError } = mockReqRes(lead, { sprintId: sprintB.id }, { id: createdTaskId });
      await updateTask(req, res, next);
      it('rejects updating sprintId to another project\'s sprint', getError()?.errorCode === 'NOT_FOUND');
    }

    {
      const { req, res, next, getError } = mockReqRes(lead, { epicId: epicB.id }, { id: createdTaskId });
      await updateTask(req, res, next);
      it('rejects updating epicId to another project\'s epic', getError()?.errorCode === 'NOT_FOUND');
    }

    {
      const { req, res, next, getError } = mockReqRes(lead, { milestoneId: milestoneB.id }, { id: createdTaskId });
      await updateTask(req, res, next);
      it('rejects updating milestoneId to another project\'s milestone', getError()?.errorCode === 'NOT_FOUND');
    }

    {
      const { req, res, next, getError } = mockReqRes(lead, { dependenciesIds: [taskInProjectB.id] }, { id: createdTaskId });
      await updateTask(req, res, next);
      it('rejects a dependenciesIds entry from another project', getError()?.errorCode === 'NOT_FOUND');
    }

    {
      const { req, res, next, getError } = mockReqRes(lead, { assigneeId: stranger.id }, { id: createdTaskId });
      await updateTask(req, res, next);
      it('rejects assigning to a user outside the project', getError()?.errorCode === 'FORBIDDEN');
    }

    // --- updateTask: same-project references still work ------------------
    console.log('\n4. updateTask still allows same-project references');
    {
      const { req, res, next, getError } = mockReqRes(lead, { sprintId: sprintA.id, epicId: epicA.id, milestoneId: milestoneA.id }, { id: createdTaskId });
      await updateTask(req, res, next);
      const err = getError();
      it('accepts sprintId/epicId/milestoneId from the task\'s own project', !err && res.body?.data?.task?.sprintId === sprintA.id);
    }

    console.log('\n====================================================');
    console.log(`Task Cross-Project Reference Suite: ${passedTests}/${totalTests} Passed`);
    console.log('====================================================\n');

    if (passedTests !== totalTests) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Task cross-project reference suite error:', err);
    process.exitCode = 1;
  } finally {
    try {
      if (lead) await prisma.user.delete({ where: { id: lead.id } }).catch(() => {});
      if (stranger) await prisma.user.delete({ where: { id: stranger.id } }).catch(() => {});
    } finally {
      await prisma.$disconnect();
    }
  }
}

run();
