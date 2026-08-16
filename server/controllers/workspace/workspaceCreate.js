import { prisma } from '../../config/prisma.js';
import { createWorkspaceSlug } from './workspaceHelpers.js';
import { eventBus } from '../../services/eventBus.js';
import { redisCache } from '../../config/redis.js';
import { executeTransaction, getCachedOrFetch } from '../../services/db/dbService.js';
import { BadRequestError } from '../../utils/errors/appError.js';
import { ApiResponse } from '../../utils/response/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const createWorkspace = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { name, description = '', image_url = '' } = req.body;
  if (!name?.trim()) throw new BadRequestError('Workspace name is required');

  const workspace = await executeTransaction(async (tx) => {
    return await tx.workspace.create({
      data: {
        name: name.trim(),
        slug: createWorkspaceSlug(name),
        description: description.trim() || null,
        ownerId: userId,
        image_url: image_url.trim(),
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
    data: { workspace },
    message: 'Workspace created successfully',
  });
});

export const getUserWorkspaces = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const cacheKey = `user:workspaces:${userId}`;

  const result = await getCachedOrFetch(
    cacheKey,
    async () => {
      const workspaceMemberships = await prisma.workspaceMember.findMany({
        where: { userId },
        include: {
          workspace: {
            include: {
              members: { include: { user: true } },
              projects: {
                include: {
                  tasks: { include: { assignee: true, comments: { include: { user: true } }, dependencies: true, blockedTasks: true } },
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

export default { createWorkspace, getUserWorkspaces };
