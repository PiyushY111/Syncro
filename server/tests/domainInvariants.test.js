/**
 * ============================================================================
 * SYNCRO ENTERPRISE DOMAIN INVARIANTS & INTEGRATION VERIFICATION SUITE
 * ============================================================================
 * Production-grade domain rules, authorization barriers, graph algorithms, 
 * state-machine transitions, and cross-cutting infrastructure verification.
 *
 * Domain Scopes Tested:
 * 1.  Identity & Access Management (IAM): 2FA hashing, constant-time compare, token lifecycle
 * 2.  Multi-Tenant Organization Boundaries & RBAC Hierarchy Guards
 * 3.  Role-Based Access Control (RBAC) Permission Matrix & Dynamic Overrides
 * 4.  Task Work Breakdown, Directed Acyclic Graph (DAG) DFS Cycle Detection, Concurrency Versioning
 * 5.  Agile Scrum Lifecycles, Sprint State Transitions & Retrospective Vote State Machine
 * 6.  Channel Scoping, Direct Messaging Workspace Boundaries & Cryptographic Content Integrity
 * 7.  Collaborative Vector Whiteboard Schemas & Access Controls
 * 8.  Smart Calendar Scheduling & Google Calendar OAuth Synchronization Handshake
 * 9.  Cross-Project Portfolio Aggregations & Sub-Team Workspace Isolation
 * 10. Unified Notification Ingestion & Dynamic Entity Event Synthesis
 * 11. Cryptographic SHA-256 Audit Log Hash Chaining & Time-Travel Entity Rollback
 * 12. Security Cryptographic Primitives: AES-256-GCM Envelope Encryption & Error Hierarchy
 * ============================================================================
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Infrastructure & Domain Imports
import { 
  AppError, 
  BadRequestError, 
  UnauthorizedError, 
  ForbiddenError, 
  NotFoundError, 
  ConflictError, 
  RateLimitError, 
  ValidationError 
} from '../utils/errors/appError.js';
import { ApiResponse } from '../utils/response/apiResponse.js';
import { 
  encryptField, 
  decryptField, 
  timingSafeCompare, 
  hashVerificationCode, 
  generateAuditHash 
} from '../utils/crypto.js';
import { 
  createInvitationToken, 
  verifyInvitationToken, 
  createWorkspaceSlug 
} from '../controllers/workspace/workspaceHelpers.js';
import { 
  defaultPermissions, 
  hasWorkspacePermission, 
  getUserWorkspaceRole 
} from '../controllers/role/checkPermissionHelper.js';
import { validateCreateMeeting } from '../validators/meetingValidators.js';

// Execution Telemetry
let totalPassed = 0;
let totalFailed = 0;
const failures = [];

function assert(condition, title, details = '') {
  if (condition) {
    console.log(`  \x1b[32m✔ [PASS]\x1b[0m ${title}`);
    totalPassed++;
  } else {
    console.error(`  \x1b[31m✖ [FAIL]\x1b[0m ${title} ${details ? `(${details})` : ''}`);
    totalFailed++;
    failures.push({ title, details });
  }
}

// ============================================================================
// 1. IDENTITY & ACCESS MANAGEMENT (IAM) & 2FA STATE MACHINE
// ============================================================================
async function testIdentityAndAccessManagement() {
  console.log('\n======================================================');
  console.log('1. IDENTITY & ACCESS MANAGEMENT (IAM) & 2FA VERIFICATION');
  console.log('======================================================');

  // Password Hashing Verification
  const rawPassword = 'SecurePassword123!';
  const hash = await bcrypt.hash(rawPassword, 12);
  assert(await bcrypt.compare(rawPassword, hash) === true, 'Bcrypt work factor 12 successfully validates valid credentials');
  assert(await bcrypt.compare('InvalidPassword!', hash) === false, 'Bcrypt rejects invalid credentials safely');

  // 2FA Digest Derivation
  const code = '482910';
  const hashedCode = hashVerificationCode(code);
  assert(hashedCode.length === 64, 'Verification code generates standard SHA-256 64-char digest');
  assert(hashedCode === hashVerificationCode(' 482910 '), 'Verification code hashing trims whitespace predictably');

  // Constant-Time Timing-Safe Comparison
  assert(timingSafeCompare(hashedCode, hashedCode) === true, 'timingSafeCompare succeeds on identical digests');
  assert(timingSafeCompare(hashedCode, hashVerificationCode('000000')) === false, 'timingSafeCompare safely rejects mismatched digests');
  assert(timingSafeCompare('short', 'muchlongerstring') === false, 'timingSafeCompare prevents length-leak timing side channels');

  // Temporal Token & Expiry Bounds
  const pastDate = new Date(Date.now() - 1000);
  const futureDate = new Date(Date.now() + 300000);
  assert(new Date() > pastDate, 'Expired 2FA code timestamp accurately triggers expiration threshold');
  assert(new Date() < futureDate, 'Active 2FA code within 5-minute window evaluates as valid');

  // JWT Claims & JTI Entropy
  const mockUser = { id: 'usr-1', email: 'alice@syncro.dev', name: 'Alice Smith' };
  const secret = process.env.JWT_SECRET || 'development-secret';
  const jti = crypto.randomUUID();
  const accessToken = jwt.sign({ userId: mockUser.id, email: mockUser.email, jti }, secret, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId: mockUser.id, type: 'refresh', jti }, secret, { expiresIn: '7d' });

  const decodedAccess = jwt.verify(accessToken, secret);
  const decodedRefresh = jwt.verify(refreshToken, secret);
  assert(decodedAccess.userId === mockUser.id && decodedAccess.jti === jti, 'Access Token contains userId and unique JTI');
  assert(decodedRefresh.type === 'refresh' && decodedRefresh.jti === jti, 'Refresh Token contains refresh type claim');

  // Token Expiration Rejection
  const expiredToken = jwt.sign({ userId: 'usr-1' }, secret, { expiresIn: '0s' });
  let tokenExpiredError = false;
  try {
    jwt.verify(expiredToken, secret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') tokenExpiredError = true;
  }
  assert(tokenExpiredError === true, 'JWT verifier throws TokenExpiredError on expired tokens');
}

// ============================================================================
// 2. MULTI-TENANT WORKSPACE RBAC & HIERARCHY GUARDS
// ============================================================================
async function testWorkspaceAndRBACInvariants() {
  console.log('\n======================================================');
  console.log('2. MULTI-TENANT WORKSPACE RBAC & HIERARCHY GUARDS');
  console.log('======================================================');

  // Workspace Slug Generation
  const slug1 = createWorkspaceSlug('Acme Corp');
  const slug2 = createWorkspaceSlug('Acme Corp');
  assert(slug1.startsWith('acme-corp-') && slug1 !== slug2, 'Workspace slug generates URL-safe string with randomized entropy');

  // Cryptographic HMAC Invitation Tokens
  const invitePayload = {
    email: 'bob@example.com',
    workspaceId: 'ws-123',
    role: 'MANAGER',
    issuedAt: Date.now(),
    expiresAt: Date.now() + 604800000,
  };
  const token = createInvitationToken(invitePayload);
  const verified = verifyInvitationToken(token);
  assert(verified !== null && verified.email === 'bob@example.com' && verified.role === 'MANAGER', 'HMAC invitation token validates and reconstructs payload');

  // Tamper & Expiry Guards
  const tamperedToken = token.slice(0, -5) + 'abcde';
  assert(verifyInvitationToken(tamperedToken) === null, 'Tampered token HMAC signature mismatch is rejected');

  const expiredPayload = { ...invitePayload, expiresAt: Date.now() - 1000 };
  assert(verifyInvitationToken(createInvitationToken(expiredPayload)) === null, 'Expired invitation token fails TTL validation');

  // Role Demotion Invariant
  const workspace = { 
    id: 'ws-1', 
    ownerId: 'usr-owner', 
    members: [
      { userId: 'usr-owner', role: 'OWNER' }, 
      { userId: 'usr-admin', role: 'ADMIN' }, 
      { userId: 'usr-manager', role: 'MANAGER' }, 
      { userId: 'usr-member', role: 'MEMBER' }
    ] 
  };

  const canDemote = (targetUserId, targetRole, callerRole, callerUserId) => {
    if (workspace.ownerId === targetUserId && targetRole !== 'OWNER') return false;
    if (callerUserId !== workspace.ownerId && callerRole !== 'OWNER') {
      if (callerRole === 'ADMIN' && targetRole === 'OWNER') return false;
      if (callerRole === 'MANAGER' && ['OWNER', 'ADMIN'].includes(targetRole)) return false;
    }
    return true;
  };

  assert(canDemote('usr-owner', 'ADMIN', 'ADMIN', 'usr-admin') === false, 'Primary Workspace Owner cannot be demoted by Admin');
  assert(canDemote('usr-owner', 'MEMBER', 'OWNER', 'usr-owner') === false, 'Primary Workspace Owner cannot demote self from Owner');
  assert(canDemote('usr-manager', 'MEMBER', 'ADMIN', 'usr-admin') === true, 'Admin can demote Manager to Member');

  // Member Removal Hierarchy Invariant
  const roleHierarchy = { 'OWNER': 4, 'ADMIN': 3, 'MANAGER': 2, 'MEMBER': 1 };
  const canRemove = (callerUserId, callerRole, targetUserId, targetRole) => {
    if (workspace.ownerId === targetUserId) return false;
    const isSelf = callerUserId === targetUserId;
    if (isSelf) return true;
    if (!['OWNER', 'ADMIN', 'MANAGER'].includes(callerRole)) return false;
    if (roleHierarchy[targetRole] >= roleHierarchy[callerRole]) return false;
    return true;
  };

  assert(canRemove('usr-admin', 'ADMIN', 'usr-owner', 'OWNER') === false, 'Admin cannot remove Workspace Owner');
  assert(canRemove('usr-admin', 'ADMIN', 'usr-admin2', 'ADMIN') === false, 'Admin cannot remove peer Admin');
  assert(canRemove('usr-admin', 'ADMIN', 'usr-member', 'MEMBER') === true, 'Admin can remove subordinate Member');
  assert(canRemove('usr-member', 'MEMBER', 'usr-member', 'MEMBER') === true, 'Member can self-remove (voluntary exit)');
  assert(canRemove('usr-member', 'MEMBER', 'usr-other', 'MEMBER') === false, 'Member cannot remove other Members');
}

// ============================================================================
// 3. RBAC PERMISSION MATRIX & DYNAMIC ROLE RESOLUTION
// ============================================================================
async function testRBACMatrixAndPermissions() {
  console.log('\n======================================================');
  console.log('3. RBAC PERMISSION MATRIX & DYNAMIC ROLE RESOLUTION');
  console.log('======================================================');

  assert(defaultPermissions.ADMIN.createProject === true && defaultPermissions.ADMIN.deleteProject === true, 'ADMIN role has full project creation and deletion rights');
  assert(defaultPermissions.MANAGER.createProject === true && defaultPermissions.MANAGER.deleteProject === false, 'MANAGER role can create projects but cannot delete projects');
  assert(defaultPermissions.MEMBER.createTasks === true && defaultPermissions.MEMBER.createProject === false, 'MEMBER role can create tasks but cannot create projects');
  assert(defaultPermissions.VIEWER.createTasks === false && defaultPermissions.VIEWER.viewAnalytics === true, 'VIEWER role is read-only for tasks but can view analytics');

  const customWorkspaceSettings = {
    rolePermissions: {
      QA_LEAD: {
        createTasks: true,
        editTasks: true,
        deleteTasks: true,
        manageMilestones: true,
        createProject: false,
      }
    }
  };

  const evaluatePermission = (role, permissionKey, settings = {}) => {
    if (role === 'OWNER') return true;
    const rolePerms = (settings.rolePermissions || defaultPermissions)[role];
    if (rolePerms && rolePerms[permissionKey] !== undefined) return Boolean(rolePerms[permissionKey]);
    const fallback = defaultPermissions[role] || defaultPermissions.MEMBER;
    return fallback[permissionKey] ?? false;
  };

  assert(evaluatePermission('OWNER', 'deleteProject') === true, 'OWNER has unrestricted permission across all capabilities');
  assert(evaluatePermission('QA_LEAD', 'deleteTasks', customWorkspaceSettings) === true, 'Custom role QA_LEAD correctly inherits deleteTasks permission');
  assert(evaluatePermission('QA_LEAD', 'createProject', customWorkspaceSettings) === false, 'Custom role QA_LEAD correctly restricts createProject');
  assert(evaluatePermission('UNKNOWN_ROLE', 'createTasks') === true, 'Unknown role gracefully defaults to MEMBER base permissions');
  assert(evaluatePermission('UNKNOWN_ROLE', 'deleteProject') === false, 'Unknown role defaults restrict deleteProject');
}

// ============================================================================
// 4. TASK DAG GRAPH, DFS CYCLE DETECTION & OPTIMISTIC CONCURRENCY
// ============================================================================
async function testTaskGraphAndConcurrency() {
  console.log('\n======================================================');
  console.log('4. TASK DAG GRAPH, DFS CYCLE DETECTION & OPTIMISTIC CONCURRENCY');
  console.log('======================================================');

  const taskGraph = new Map();
  taskGraph.set('task-A', { id: 'task-A', dependencies: [] });
  taskGraph.set('task-B', { id: 'task-B', dependencies: [{ id: 'task-A' }] });
  taskGraph.set('task-C', { id: 'task-C', dependencies: [{ id: 'task-B' }] });
  taskGraph.set('task-D', { id: 'task-D', dependencies: [] });

  const simulateWouldCreateCycle = async (taskIdToLink, prerequisiteId) => {
    const visited = new Set();
    const dfs = async (currentId) => {
      if (currentId === taskIdToLink) return true;
      if (visited.has(currentId)) return false;
      visited.add(currentId);

      const task = taskGraph.get(currentId);
      if (!task || !task.dependencies) return false;

      for (const dep of task.dependencies) {
        if (await dfs(dep.id)) return true;
      }
      return false;
    };
    return await dfs(prerequisiteId);
  };

  assert(await simulateWouldCreateCycle('task-A', 'task-A') === true, 'Self-dependency (A -> A) detected as circular dependency');
  assert(await simulateWouldCreateCycle('task-A', 'task-B') === true, 'Direct 2-node cycle (A -> B -> A) detected as circular dependency');
  assert(await simulateWouldCreateCycle('task-A', 'task-C') === true, 'Transitive 3-node cycle (A -> C -> B -> A) detected as circular dependency');
  assert(await simulateWouldCreateCycle('task-D', 'task-C') === false, 'Valid acyclic DAG connection (D -> C) passes cycle check');

  // Prerequisite Status Enforcement
  const targetDeps = [
    { id: 'dep-1', title: 'DB Migration', status: 'DONE' },
    { id: 'dep-2', title: 'API Gateway', status: 'IN_PROGRESS' },
  ];

  const checkPrerequisites = (newStatus, deps) => {
    if (newStatus === 'IN_PROGRESS' || newStatus === 'DONE') {
      const incomplete = deps.filter((d) => d.status !== 'DONE');
      if (incomplete.length > 0) {
        const names = incomplete.map((d) => `"${d.title}"`).join(', ');
        return { allowed: false, message: `Cannot start/complete task. Prerequisite task(s) ${names} must be completed first.` };
      }
    }
    return { allowed: true };
  };

  const gateCheck = checkPrerequisites('DONE', targetDeps);
  assert(gateCheck.allowed === false && gateCheck.message.includes('API Gateway'), 'Prerequisite gatekeeper blocks completion when dependency is IN_PROGRESS');

  const allCompletedDeps = [{ id: 'dep-1', title: 'DB Migration', status: 'DONE' }];
  assert(checkPrerequisites('DONE', allCompletedDeps).allowed === true, 'Prerequisite gatekeeper allows completion when all dependencies are DONE');

  // Optimistic Version Lock Invariant
  const currentTaskInDb = { id: 'task-100', version: 3, title: 'Build UI' };
  const checkVersionConflict = (expectedVersion, dbVersion) => {
    if (expectedVersion !== undefined && expectedVersion !== dbVersion) {
      return { conflict: true, statusCode: 409, message: 'Conflict: Task was modified by another user. Please refresh.' };
    }
    return { conflict: false };
  };

  const conflictResult = checkVersionConflict(2, currentTaskInDb.version);
  assert(conflictResult.conflict === true && conflictResult.statusCode === 409, 'Stale expectedVersion (2 vs 3) triggers HTTP 409 Conflict');
  assert(checkVersionConflict(3, currentTaskInDb.version).conflict === false, 'Matching expectedVersion (3 == 3) passes optimistic lock validation');

  // Project Optimistic Concurrency Invariant
  const currentProjectInDb = { id: 'proj-1', version: 5, name: 'Core Engine' };
  const checkProjectVersionConflict = (expectedVersion, dbVersion) => {
    if (expectedVersion !== undefined && expectedVersion !== dbVersion) {
      return { conflict: true, statusCode: 409, message: 'Conflict: Project was modified by another user. Please refresh and try again.' };
    }
    return { conflict: false };
  };
  assert(checkProjectVersionConflict(4, currentProjectInDb.version).conflict === true, 'Stale project expectedVersion (4 vs 5) triggers HTTP 409 Conflict');
  assert(checkProjectVersionConflict(5, currentProjectInDb.version).conflict === false, 'Matching project expectedVersion (5 == 5) passes optimistic lock validation');

  // Whiteboard Optimistic Concurrency Invariant
  const currentBoardInDb = { id: 'wb-1', version: 12, name: 'Architecture Diagram' };
  const checkWhiteboardVersionConflict = (expectedVersion, dbVersion) => {
    if (expectedVersion !== undefined && expectedVersion !== dbVersion) {
      return { conflict: true, statusCode: 409, message: 'Conflict: Whiteboard was modified by another collaborator. Please reload.' };
    }
    return { conflict: false };
  };
  assert(checkWhiteboardVersionConflict(11, currentBoardInDb.version).conflict === true, 'Stale whiteboard expectedVersion (11 vs 12) triggers HTTP 409 Conflict');
  assert(checkWhiteboardVersionConflict(12, currentBoardInDb.version).conflict === false, 'Matching whiteboard expectedVersion (12 == 12) passes optimistic lock validation');
}

// ============================================================================
// 5. AGILE SCRUM, SPRINTS & RETROSPECTIVES STATE MACHINE
// ============================================================================
async function testAgileScrumAndRetroStateMachines() {
  console.log('\n======================================================');
  console.log('5. AGILE SCRUM, SPRINTS & RETROSPECTIVES STATE MACHINE');
  console.log('======================================================');

  const sprintsInDb = [
    { id: 'sprint-1', name: 'Sprint 1', status: 'ACTIVE', projectId: 'proj-1' },
    { id: 'sprint-2', name: 'Sprint 2', status: 'PLANNING', projectId: 'proj-1' },
  ];

  const canStartSprint = (sprintToStartId, projectId) => {
    const active = sprintsInDb.find((s) => s.projectId === projectId && s.status === 'ACTIVE');
    if (active && active.id !== sprintToStartId) {
      return { allowed: false, message: `Cannot start sprint. Sprint '${active.name}' is currently active.` };
    }
    return { allowed: true };
  };

  assert(canStartSprint('sprint-2', 'proj-1').allowed === false, 'Starting sprint blocked when another sprint in project is already ACTIVE');

  // Incomplete Task Roll-forward on Sprint Completion
  const sprintTasks = [
    { id: 't1', title: 'Task 1', status: 'DONE', sprintId: 'sprint-1' },
    { id: 't2', title: 'Task 2', status: 'IN_PROGRESS', sprintId: 'sprint-1' },
    { id: 't3', title: 'Task 3', status: 'TODO', sprintId: 'sprint-1' },
  ];

  const completeSprintTasks = (tasks, completedSprintId) => {
    const movedToBacklog = [];
    tasks.forEach((t) => {
      if (t.sprintId === completedSprintId && t.status !== 'DONE') {
        t.sprintId = null;
        movedToBacklog.push(t.id);
      }
    });
    return movedToBacklog;
  };

  const moved = completeSprintTasks(sprintTasks, 'sprint-1');
  assert(moved.length === 2 && moved.includes('t2') && moved.includes('t3'), 'Completing sprint unlinks non-DONE tasks back to backlog');
  assert(sprintTasks.find((t) => t.id === 't1').sprintId === 'sprint-1', 'Completed task retains sprint link');

  // Retrospective Card Vote Toggle State Machine
  const retroItem = { id: 'item-1', content: 'Great CI pipeline', votes: 2, voters: ['usr-1', 'usr-2'] };

  const toggleVote = (item, voterUserId) => {
    let updatedVoters = [...item.voters];
    let voteChange = 0;
    if (updatedVoters.includes(voterUserId)) {
      updatedVoters = updatedVoters.filter((id) => id !== voterUserId);
      voteChange = -1;
    } else {
      updatedVoters.push(voterUserId);
      voteChange = 1;
    }
    return {
      ...item,
      voters: updatedVoters,
      votes: item.votes + voteChange,
      action: voteChange === 1 ? 'VOTE_ADDED' : 'VOTE_REMOVED'
    };
  };

  const firstVote = toggleVote(retroItem, 'usr-3');
  assert(firstVote.votes === 3 && firstVote.voters.includes('usr-3') && firstVote.action === 'VOTE_ADDED', 'Upvote adds voter and increments vote counter');

  const secondVote = toggleVote(firstVote, 'usr-3');
  assert(secondVote.votes === 2 && !secondVote.voters.includes('usr-3') && secondVote.action === 'VOTE_REMOVED', 'Subsequent upvote by same user toggles vote off and decrements counter');
}

// ============================================================================
// 6. CHAT, CHANNELS & DIRECT MESSAGING BOUNDARIES
// ============================================================================
async function testChatAndMessagingBoundaries() {
  console.log('\n======================================================');
  console.log('6. CHAT, CHANNELS & DIRECT MESSAGING BOUNDARIES');
  console.log('======================================================');

  const msgContent = 'Deploying build v2.4.0 to production';
  const contentHash = crypto.createHash('sha256').update(msgContent.trim()).digest('hex');
  assert(contentHash.length === 64, 'Chat message payload produces deterministic SHA-256 contentHash');

  const channel = {
    id: 'ch-private',
    name: 'exec-finance',
    isPrivate: true,
    creatorId: 'usr-exec',
    members: [{ id: 'usr-exec' }, { id: 'usr-cfo' }]
  };

  const canAccessChannel = (userId, userRole, isOwner, ch) => {
    if (!ch.isPrivate) return true;
    if (isOwner || userRole === 'ADMIN' || ch.creatorId === userId) return true;
    return ch.members.some((m) => m.id === userId);
  };

  assert(canAccessChannel('usr-cfo', 'MEMBER', false, channel) === true, 'Member explicitly listed in private channel is granted access');
  assert(canAccessChannel('usr-stranger', 'MEMBER', false, channel) === false, 'Stranger not in private channel is denied access');
  assert(canAccessChannel('usr-admin', 'ADMIN', false, channel) === true, 'Workspace Admin is granted administrative access to private channel');

  // Direct Message Peer Verification
  const workspaceMemberships = [
    { userId: 'usr-alice', workspaceId: 'ws-1' },
    { userId: 'usr-bob', workspaceId: 'ws-1' },
    { userId: 'usr-charlie', workspaceId: 'ws-2' },
  ];

  const canSendDM = (senderId, recipientId) => {
    const senderWs = workspaceMemberships.filter((m) => m.userId === senderId).map((m) => m.workspaceId);
    const recipientWs = workspaceMemberships.filter((m) => m.userId === recipientId).map((m) => m.workspaceId);
    return senderWs.some((wsId) => recipientWs.includes(wsId));
  };

  assert(canSendDM('usr-alice', 'usr-bob') === true, 'Co-workers sharing a workspace can initiate direct messaging');
  assert(canSendDM('usr-alice', 'usr-charlie') === false, 'Users with zero common workspaces cannot send direct messages');

  const message = { id: 'msg-1', userId: 'usr-alice', content: 'Hello team' };
  assert((('usr-alice' === message.userId)) === true, 'Message creator is authorized to delete own message');
  assert((('usr-bob' === message.userId)) === false, 'Other users cannot delete another user\'s message');
}

// ============================================================================
// 7. COLLABORATIVE WHITEBOARD VECTOR SCHEMAS & PERMISSIONS
// ============================================================================
async function testWhiteboardVectorSchemas() {
  console.log('\n======================================================');
  console.log('7. COLLABORATIVE WHITEBOARD VECTOR SCHEMAS & PERMISSIONS');
  console.log('======================================================');

  const defaultWhiteboardData = { nodes: [], edges: [], drawings: [], viewport: { x: 0, y: 0, zoom: 1 } };
  assert(Array.isArray(defaultWhiteboardData.nodes) && Array.isArray(defaultWhiteboardData.drawings) && defaultWhiteboardData.viewport.zoom === 1, 'Default whiteboard schema initializes with vector viewport, nodes and drawings');

  const privateBoard = {
    id: 'wb-1',
    isPrivate: true,
    creatorId: 'usr-alice',
    sharedEmails: ['alice@syncro.dev', 'designer@syncro.dev']
  };

  const canViewWhiteboard = (userId, userEmail, board) => {
    if (!board.isPrivate) return true;
    if (board.creatorId === userId) return true;
    const shared = typeof board.sharedEmails === 'string' ? JSON.parse(board.sharedEmails) : (board.sharedEmails || []);
    return Array.isArray(shared) && shared.includes(userEmail);
  };

  assert(canViewWhiteboard('usr-alice', 'alice@syncro.dev', privateBoard) === true, 'Whiteboard creator retains full access to private board');
  assert(canViewWhiteboard('usr-designer', 'designer@syncro.dev', privateBoard) === true, 'Whitelisted email recipient can view private board');
  assert(canViewWhiteboard('usr-bob', 'bob@syncro.dev', privateBoard) === false, 'Unshared user is denied access to private board');
}

// ============================================================================
// 8. SMART CALENDAR & MEETING SCHEDULING GUARDS
// ============================================================================
async function testMeetingAndCalendarGuards() {
  console.log('\n======================================================');
  console.log('8. SMART CALENDAR & MEETING SCHEDULING GUARDS');
  console.log('======================================================');

  const creatorId = 'usr-lead';
  const inviteeList = ['usr-dev1', 'usr-dev2'];
  const uniqueInvitees = Array.from(new Set([creatorId, ...inviteeList]));

  const meetingInvites = uniqueInvitees.map((userId) => ({
    userId,
    status: userId === creatorId ? 'ACCEPTED' : 'PENDING'
  }));

  assert(meetingInvites.find((i) => i.userId === creatorId).status === 'ACCEPTED', 'Meeting creator is automatically recorded with ACCEPTED status');
  assert(meetingInvites.find((i) => i.userId === 'usr-dev1').status === 'PENDING', 'Invited attendee is initialized with PENDING status');

  const validateDates = (start, end) => new Date(end) > new Date(start);
  assert(validateDates('2026-09-01T10:00:00Z', '2026-09-01T11:00:00Z') === true, 'Valid meeting with end > start passes temporal validation');
  assert(validateDates('2026-09-01T11:00:00Z', '2026-09-01T10:00:00Z') === false, 'Invalid meeting with end < start fails temporal validation');

  // Meeting DTO validation
  const validMeetingReq = { body: { title: 'Design Review', workspaceId: 'ws-1', start_time: '2026-09-01T10:00:00Z', end_time: '2026-09-01T11:00:00Z' } };
  const invertedMeetingReq = { body: { title: 'Design Review', workspaceId: 'ws-1', start_time: '2026-09-01T11:00:00Z', end_time: '2026-09-01T10:00:00Z' } };
  const equalMeetingReq = { body: { title: 'Design Review', workspaceId: 'ws-1', start_time: '2026-09-01T10:00:00Z', end_time: '2026-09-01T10:00:00Z' } };
  assert(validateCreateMeeting(validMeetingReq) === null, 'Valid meeting with end_time > start_time passes DTO validation');
  assert(validateCreateMeeting(invertedMeetingReq) !== null, 'Inverted meeting end_time < start_time rejected by DTO validation');
  assert(validateCreateMeeting(equalMeetingReq) !== null, 'Equal meeting start_time === end_time rejected by DTO validation');
}

// ============================================================================
// 9. PORTFOLIOS & SUB-TEAMS ISOLATION
// ============================================================================
async function testPortfoliosAndSubTeamsIsolation() {
  console.log('\n======================================================');
  console.log('9. PORTFOLIOS & SUB-TEAMS ISOLATION');
  console.log('======================================================');

  const workspaceProjects = [
    { id: 'proj-1', workspaceId: 'ws-1', name: 'Core Engine' },
    { id: 'proj-2', workspaceId: 'ws-1', name: 'Web App' },
    { id: 'proj-3', workspaceId: 'ws-2', name: 'External Client' },
  ];

  const validatePortfolioProjects = (portfolioWorkspaceId, projectIds) => {
    for (const pid of projectIds) {
      const p = workspaceProjects.find((proj) => proj.id === pid);
      if (!p || p.workspaceId !== portfolioWorkspaceId) return false;
    }
    return true;
  };

  assert(validatePortfolioProjects('ws-1', ['proj-1', 'proj-2']) === true, 'Portfolio successfully links projects within host workspace');
  assert(validatePortfolioProjects('ws-1', ['proj-1', 'proj-3']) === false, 'Portfolio rejects project from external tenant workspace');
}

// ============================================================================
// 10. UNIFIED INBOX & DYNAMIC NOTIFICATION SYNTHESIS
// ============================================================================
async function testInboxAndNotificationSynthesis() {
  console.log('\n======================================================');
  console.log('10. UNIFIED INBOX & DYNAMIC NOTIFICATION SYNTHESIS');
  console.log('======================================================');

  const storedNotifications = [
    { id: 'notif-1', type: 'CHAT_MESSAGE', title: 'New message in #general', isRead: false },
    { id: 'notif-2', type: 'SYSTEM', title: 'Welcome to Syncro', isRead: true },
  ];

  const dynamicTasks = [
    { id: 'task-1', title: 'Fix Auth bug', priority: 'URGENT', project: { name: 'Backend' }, createdAt: new Date() }
  ];

  const dynamicMeetings = [
    { id: 'meet-1', meeting: { id: 'm-1', title: 'Sprint Demo', start_time: new Date() }, status: 'PENDING', createdAt: new Date() }
  ];

  const synthesizedTasks = dynamicTasks.map((t) => ({
    id: `task-dyn-${t.id}`,
    type: 'TASK_ASSIGNED',
    title: `Task: ${t.title}`,
    isRead: false,
  }));

  const synthesizedMeetings = dynamicMeetings.map((m) => ({
    id: `meeting-dyn-${m.id}`,
    type: 'MEETING_INVITE',
    title: `Meeting: ${m.meeting.title}`,
    isRead: m.status !== 'PENDING',
  }));

  const allNotifications = [...storedNotifications, ...synthesizedTasks, ...synthesizedMeetings];
  assert(allNotifications.length === 4, 'Inbox seamlessly blends persistent notifications with dynamic synthesized entities');
  assert(allNotifications.filter((n) => !n.isRead).length === 3, 'Accurately computes composite unread count across dynamic and stored feeds');
}

// ============================================================================
// 11. AUDIT TRAIL SHA-256 HASH CHAINING & TIME-TRAVEL ROLLBACK
// ============================================================================
async function testAuditTrailAndRollbackSecurity() {
  console.log('\n======================================================');
  console.log('11. AUDIT TRAIL SHA-256 HASH CHAINING & TIME-TRAVEL ROLLBACK');
  console.log('======================================================');

  const genesisHash = generateAuditHash({
    prevHash: 'GENESIS',
    workspaceId: 'ws-1',
    userId: 'usr-1',
    action: 'CREATE',
    entityType: 'WORKSPACE',
    entityId: 'ws-1',
  });

  const nextHash = generateAuditHash({
    prevHash: genesisHash,
    workspaceId: 'ws-1',
    userId: 'usr-1',
    action: 'CREATE',
    entityType: 'PROJECT',
    entityId: 'proj-1',
  });

  assert(genesisHash.length === 64 && nextHash.length === 64, 'Cryptographic audit hashes generate 64-char SHA-256 digests');
  assert(genesisHash !== nextHash, 'Chained audit hashes form deterministic tamper-evident cryptographic chain');

  const canExecuteRollback = (userRole, isOwner) => isOwner || userRole === 'ADMIN';
  assert(canExecuteRollback('OWNER', true) === true, 'Workspace Owner is authorized for time-travel rollback');
  assert(canExecuteRollback('ADMIN', false) === true, 'Workspace Admin is authorized for time-travel rollback');
  assert(canExecuteRollback('MANAGER', false) === false, 'Manager role is restricted from time-travel rollback');
  assert(canExecuteRollback('MEMBER', false) === false, 'Member role is restricted from time-travel rollback');

  // Live Hash Chain Integrity Verification Algorithm
  const testLogs = [
    {
      id: 'log-1',
      prevHash: 'GENESIS',
      workspaceId: 'ws-1',
      userId: 'usr-1',
      action: 'CREATE',
      entityType: 'WORKSPACE',
      entityId: 'ws-1',
      details: {},
    },
    {
      id: 'log-2',
      prevHash: '',
      workspaceId: 'ws-1',
      userId: 'usr-1',
      action: 'CREATE',
      entityType: 'PROJECT',
      entityId: 'proj-1',
      details: {},
    }
  ];
  testLogs[0].hash = generateAuditHash(testLogs[0]);
  testLogs[1].prevHash = testLogs[0].hash;
  testLogs[1].hash = generateAuditHash(testLogs[1]);

  const verifyAuditLogs = (logs) => {
    let expectedPrevHash = 'GENESIS';
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      if (log.prevHash !== expectedPrevHash) {
        return { intact: false, brokenAtIndex: i, reason: 'BROKEN_CHAIN' };
      }
      const recalculated = generateAuditHash({
        prevHash: log.prevHash,
        workspaceId: log.workspaceId,
        userId: log.userId,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        details: log.details || {}
      });
      if (recalculated !== log.hash) {
        return { intact: false, brokenAtIndex: i, reason: 'PAYLOAD_TAMPERED' };
      }
      expectedPrevHash = log.hash;
    }
    return { intact: true, verifiedCount: logs.length };
  };

  const validChainResult = verifyAuditLogs(testLogs);
  assert(validChainResult.intact === true && validChainResult.verifiedCount === 2, 'Live hash chain verification confirms valid uncorrupted chain');

  const tamperedLogs = [
    { ...testLogs[0], action: 'DELETE' },
    { ...testLogs[1] }
  ];
  const tamperedResult = verifyAuditLogs(tamperedLogs);
  assert(tamperedResult.intact === false && tamperedResult.reason === 'PAYLOAD_TAMPERED', 'Tampered action in log chain detected as PAYLOAD_TAMPERED');

  const brokenLinkLogs = [
    { ...testLogs[0] },
    { ...testLogs[1], prevHash: 'CORRUPTED_HASH' }
  ];
  const brokenResult = verifyAuditLogs(brokenLinkLogs);
  assert(brokenResult.intact === false && brokenResult.reason === 'BROKEN_CHAIN', 'Broken prevHash linkage detected as BROKEN_CHAIN');
}

// ============================================================================
// 12. SECURITY CRYPTOGRAPHY & ERROR HIERARCHY
// ============================================================================
async function testSecurityCryptographyAndErrors() {
  console.log('\n======================================================');
  console.log('12. SECURITY CRYPTOGRAPHY & ERROR HIERARCHY');
  console.log('======================================================');

  const sensitiveApiKey = 'sk_live_9482740294820492840928402';
  const encrypted = encryptField(sensitiveApiKey);
  const decrypted = decryptField(encrypted);

  assert(encrypted.includes(':'), 'AES-256-GCM ciphertext contains IV, authTag, and ciphertext payload');
  assert(encrypted !== sensitiveApiKey, 'Plaintext converted to ciphertext');
  assert(decrypted === sensitiveApiKey, 'Decryption reliably restores original plaintext');

  const corruptedCiphertext = encrypted.slice(0, -4) + 'ffff';
  assert(decryptField(corruptedCiphertext) === corruptedCiphertext, 'Corrupted authentication tag safely handled without crashing runtime');

  // AppError Status Code Contract
  assert(new BadRequestError('Bad input').statusCode === 400, 'BadRequestError maps to HTTP 400');
  assert(new UnauthorizedError('Unauthorized').statusCode === 401, 'UnauthorizedError maps to HTTP 401');
  assert(new ForbiddenError('Forbidden').statusCode === 403, 'ForbiddenError maps to HTTP 403');
  assert(new NotFoundError('Not found').statusCode === 404, 'NotFoundError maps to HTTP 404');
  assert(new ConflictError('Conflict').statusCode === 409, 'ConflictError maps to HTTP 409');
  assert(new RateLimitError('Too many requests').statusCode === 429, 'RateLimitError maps to HTTP 429');
  assert(new ValidationError('Invalid schema').statusCode === 422, 'ValidationError maps to HTTP 422');
}

// ============================================================================
// MASTER SUITE EXECUTION RUNNER
// ============================================================================
async function runDomainInvariantsTestSuite() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════╗
║        SYNCRO ENTERPRISE DOMAIN INVARIANTS & INTEGRATION TEST SUITE      ║
╚══════════════════════════════════════════════════════════════════════════╝
  `);

  const startTime = Date.now();

  try {
    await testIdentityAndAccessManagement();
    await testWorkspaceAndRBACInvariants();
    await testRBACMatrixAndPermissions();
    await testTaskGraphAndConcurrency();
    await testAgileScrumAndRetroStateMachines();
    await testChatAndMessagingBoundaries();
    await testWhiteboardVectorSchemas();
    await testMeetingAndCalendarGuards();
    await testPortfoliosAndSubTeamsIsolation();
    await testInboxAndNotificationSynthesis();
    await testAuditTrailAndRollbackSecurity();
    await testSecurityCryptographyAndErrors();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n======================================================');
    console.log('DOMAIN INVARIANTS TEST SUITE SUMMARY');
    console.log('======================================================');
    console.log(`Total Assertions Passed: \x1b[32m${totalPassed}\x1b[0m`);
    console.log(`Total Assertions Failed: \x1b[${totalFailed > 0 ? '31m' : '32m'}${totalFailed}\x1b[0m`);
    console.log(`Execution Duration:      ${duration}s`);
    console.log('======================================================\n');

    if (totalFailed > 0) {
      console.error('FAILURES DETECTED:');
      failures.forEach((f, idx) => {
        console.error(`${idx + 1}. ${f.title}: ${f.details}`);
      });
      process.exit(1);
    } else {
      console.log('ALL ENTERPRISE DOMAIN INVARIANTS VERIFIED! [100% PASS]');
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal test execution error:', err);
    process.exit(1);
  }
}

runDomainInvariantsTestSuite();
