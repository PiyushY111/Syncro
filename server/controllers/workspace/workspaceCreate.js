import { prisma } from '../../config/prisma.js';
import { createWorkspaceSlug } from './workspaceHelpers.js';
import { eventBus } from '../../services/eventBus.js';
import { redisCache } from '../../config/redis.js';
import { executeTransaction, getCachedOrFetch } from '../../services/db/dbService.js';
import { BadRequestError } from '../../utils/errors/appError.js';
import { ApiResponse } from '../../utils/response/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  resolveWorkspaceCreationPolicy,
  notifySuperAdminOfPendingRequest,
} from '../../services/gatekeeperService.js';

export const createWorkspace = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { name, description = '', image_url = '', inviteCode, requestNotes = '' } = req.body;
  if (!name?.trim()) throw new BadRequestError('Workspace name is required');

  // Resolve gatekeeper policy
  const policy = await resolveWorkspaceCreationPolicy({
    user: req.user,
    inviteCode,
  });

  const workspace = await executeTransaction(async (tx) => {
    return await tx.workspace.create({
      data: {
        name: name.trim(),
        slug: createWorkspaceSlug(name),
        description: description.trim() || null,
        ownerId: userId,
        image_url: image_url.trim(),
        approvalStatus: policy.approvalStatus,
        requestNotes: requestNotes.trim() || null,
        members: { create: { userId, role: 'OWNER' } },
      },
      include: {
        owner: true,
        members: { include: { user: true } },
        projects: {
          include: {
            tasks: { include: { assignee: true, comments: { include: { user: true } }, dependencies: true, blockedTasks: true } },
            members: { include: { user: true } },
            sprints: { include: { capacities: { include: { user: true } } } },
            epics: true,
          },
        },
      },
    });
  });

  if (policy.approvalStatus === 'PENDING') {
    notifySuperAdminOfPendingRequest({
      type: 'Workspace Creation',
      title: `${name.trim()} by ${req.user.name || req.user.email}`,
      details: {
        Workspace: name.trim(),
        Owner: `${req.user.name || 'User'} (${req.user.email})`,
        Description: description.trim() || 'None',
        RequestNotes: requestNotes.trim() || 'None',
        Status: 'PENDING_APPROVAL',
      },
    }).catch(() => {});
  }

  await eventBus
    .publish('app/workspace.created', {
      workspaceId: workspace.id,
      workspace,
      auditContext: {
        workspaceId: workspace.id,
        userId,
        ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      },
    })
    .catch((err) => console.error('[createWorkspace] Event publication error:', err));

  try {
    await redisCache.del(`user:workspaces:${userId}`);
  } catch {}

  return ApiResponse.created(res, {
    data: {
      workspace,
      requiresApproval: policy.requiresApproval,
      approvalStatus: policy.approvalStatus,
    },
    message: policy.requiresApproval
      ? 'Workspace creation request submitted for Super-Admin approval'
      : 'Workspace created successfully',
  });
});

export const getUserWorkspaces = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const cacheKey = `user:workspaces:${userId}`;

  const result = await getCachedOrFetch(
    cacheKey,
    async () => {
      const workspaceMemberships = await prisma.workspaceMember.findMany({
        where: {
          userId,
          workspace: {
            approvalStatus: 'APPROVED',
            deletedAt: null,
          },
        },
        include: {
          workspace: {
            include: {
              members: { include: { user: true } },
              projects: {
                include: {
                  tasks: {
                    select: {
                      id: true,
                      title: true,
                      status: true,
                      priority: true,
                      type: true,
                      due_date: true,
                      assigneeId: true,
                      assignee: true,
                      projectId: true,
                    },
                  },
                  members: { include: { user: true } },
                  sprints: { include: { capacities: { include: { user: true } } } },
                  epics: true,
                },
              },
              owner: true,
            },
          },
        },
      });

      const workspaces = [];
      for (const membership of workspaceMemberships) {
        const workspace = membership.workspace;
        if (!workspace || workspace.approvalStatus !== 'APPROVED') continue;

        const userRole = membership.role;
        const isManagerOrOwner = ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole) || workspace.ownerId === userId;

        if (!isManagerOrOwner) {
          const userSubTeams = await prisma.subTeam.findMany({
            where: { workspaceId: workspace.id, members: { some: { userId } } },
            select: { projectId: true },
          });
          const allowedProjectIds = userSubTeams.map((s) => s.projectId).filter(Boolean);

          workspace.projects = workspace.projects.filter((project) => {
            const isLead = project.team_lead === userId;
            const isDirectMember = project.members.some((m) => m.userId === userId);
            const isSubTeamMember = allowedProjectIds.includes(project.id);
            return isLead || isDirectMember || isSubTeamMember;
          });
        }
        workspaces.push(workspace);
      }

      return { workspaces };
    },
    10
  );

  return ApiResponse.success(res, { data: result });
});

/**
 * Fetch all workspace creation requests submitted by the authenticated user (PENDING & REJECTED).
 */
export const getMyWorkspaceRequests = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const requests = await prisma.workspace.findMany({
    where: {
      ownerId: userId,
      approvalStatus: { in: ['PENDING', 'REJECTED'] },
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image_url: true,
      approvalStatus: true,
      requestNotes: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return ApiResponse.success(res, {
    data: { requests },
  });
});

/**
 * Delete or dismiss a rejected workspace request.
 */
export const deleteMyWorkspaceRequest = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const workspace = await prisma.workspace.findFirst({
    where: {
      id,
      ownerId: userId,
      approvalStatus: { in: ['REJECTED', 'PENDING'] },
    },
  });

  if (!workspace) {
    throw new BadRequestError('Workspace request not found or cannot be deleted');
  }

  await prisma.workspace.delete({
    where: { id },
  });

  return ApiResponse.success(res, {
    message: 'Workspace request removed successfully',
  });
});

export default {
  createWorkspace,
  getUserWorkspaces,
  getMyWorkspaceRequests,
  deleteMyWorkspaceRequest,
};
