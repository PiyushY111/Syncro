import { prisma } from '../config/prisma.js';
import { hasWorkspacePermission } from './role/checkPermissionHelper.js';
import { eventBus } from '../services/eventBus.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/response/apiResponse.js';
import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from '../utils/errors/appError.js';

// 1. Create a sub-team
export const createSubTeam = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { name, description = '', workspaceId } = req.body;

    if (!name?.trim()) {
        throw new BadRequestError("Sub-team name is required");
    }
    if (!workspaceId) {
        throw new BadRequestError("workspaceId is required");
    }

    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: { members: true }
    });

    if (!workspace) {
        throw new NotFoundError("Workspace not found");
    }

    const hasPermission = await hasWorkspacePermission(userId, workspaceId, 'manageSubTeams');

    if (!hasPermission) {
        throw new ForbiddenError("Only workspace owners or managers can create sub-teams");
    }

    const subTeam = await prisma.subTeam.create({
        data: {
            name: name.trim(),
            description: description.trim() || null,
            workspaceId
        },
        include: {
            members: { include: { user: true } },
            project: true
        }
    });

    await eventBus.publish('app/subteam.created', {
        subTeam,
        workspaceId,
        auditContext: {
            workspaceId,
            userId,
            ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
            userAgent: req.headers["user-agent"]
        }
    }).catch(err => console.error('[createSubTeam] Event publication error:', err));

    return ApiResponse.created(res, {
        data: { subTeam },
        message: "Sub-team created successfully"
    });
});

// 2. Get workspace sub-teams
export const getWorkspaceSubTeams = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { workspaceId } = req.params;

    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: { members: true }
    });

    if (!workspace) {
        throw new NotFoundError("Workspace not found");
    }

    // Verify membership
    const isMember = workspace.members.some(m => m.userId === userId) || workspace.ownerId === userId;
    if (!isMember) {
        throw new ForbiddenError("Access restricted");
    }

    const subTeams = await prisma.subTeam.findMany({
        where: { workspaceId },
        include: {
            members: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
            project: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: "desc" }
    });

    return ApiResponse.success(res, {
        data: { subTeams }
    });
});

// 3. Update sub-team details or project assignment
export const updateSubTeam = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, description, projectId } = req.body;

    const subTeam = await prisma.subTeam.findUnique({
        where: { id },
        include: { workspace: { include: { members: true } } }
    });

    if (!subTeam) {
        throw new NotFoundError("Sub-team not found");
    }

    const hasPermission = await hasWorkspacePermission(userId, subTeam.workspaceId, 'manageSubTeams');

    if (!hasPermission) {
        throw new ForbiddenError("Only workspace owners or managers can modify sub-teams");
    }

    // Validate project if we are assigning one
    if (projectId) {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) {
            throw new NotFoundError("Project not found");
        }
        if (project.workspaceId !== subTeam.workspaceId) {
            throw new BadRequestError("Project must belong to the same workspace as the sub-team");
        }
    }

    const previousState = await prisma.subTeam.findUnique({
        where: { id },
        include: {
            members: { include: { user: true } },
            project: true
        }
    });

    const updated = await prisma.subTeam.update({
        where: { id },
        data: {
            name: name !== undefined ? name.trim() : subTeam.name,
            description: description !== undefined ? (description ? description.trim() : null) : subTeam.description,
            projectId: projectId !== undefined ? (projectId || null) : subTeam.projectId
        },
        include: {
            members: { include: { user: true } },
            project: true
        }
    });

    await eventBus.publish('app/subteam.updated', {
        subTeam: updated,
        previousState,
        workspaceId: subTeam.workspaceId,
        auditContext: {
            workspaceId: subTeam.workspaceId,
            userId,
            ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
            userAgent: req.headers["user-agent"]
        }
    }).catch(err => console.error('[updateSubTeam] Event publication error:', err));

    return ApiResponse.success(res, {
        data: { subTeam: updated },
        message: "Sub-team updated successfully"
    });
});

// 4. Delete a sub-team
export const deleteSubTeam = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    const subTeam = await prisma.subTeam.findUnique({
        where: { id },
        include: { workspace: { include: { members: true } } }
    });

    if (!subTeam) {
        throw new NotFoundError("Sub-team not found");
    }

    const hasPermission = await hasWorkspacePermission(userId, subTeam.workspaceId, 'manageSubTeams');

    if (!hasPermission) {
        throw new ForbiddenError("Only workspace owners or managers can delete sub-teams");
    }

    const previousState = await prisma.subTeam.findUnique({
        where: { id },
        include: {
            members: { include: { user: true } },
            project: true
        }
    });

    await prisma.subTeam.delete({ where: { id } });

    await eventBus.publish('app/subteam.deleted', {
        subTeamId: id,
        subTeamName: subTeam.name,
        workspaceId: subTeam.workspaceId,
        previousState,
        auditContext: {
            workspaceId: subTeam.workspaceId,
            userId,
            ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
            userAgent: req.headers["user-agent"]
        }
    }).catch(err => console.error('[deleteSubTeam] Event publication error:', err));

    return ApiResponse.success(res, {
        message: "Sub-team deleted successfully"
    });
});

// 5. Add a member to a sub-team
export const addSubTeamMember = asyncHandler(async (req, res) => {
    const adminUserId = req.user.id;
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
        throw new BadRequestError("userId is required");
    }

    const subTeam = await prisma.subTeam.findUnique({
        where: { id },
        include: { workspace: { include: { members: true } } }
    });

    if (!subTeam) {
        throw new NotFoundError("Sub-team not found");
    }

    const workspace = subTeam.workspace;
    const hasPermission = await hasWorkspacePermission(adminUserId, subTeam.workspaceId, 'manageSubTeams');

    if (!hasPermission) {
        throw new ForbiddenError("Only workspace owners or managers can manage sub-team members");
    }

    // Check if target user is in the workspace
    const targetInWorkspace = workspace.members.some(m => m.userId === userId) || workspace.ownerId === userId;
    if (!targetInWorkspace) {
        throw new BadRequestError("User must be a member of this workspace");
    }

    try {
        const membership = await prisma.subTeamMember.create({
            data: {
                subTeamId: id,
                userId
            },
            include: {
                user: { select: { id: true, name: true, email: true, image: true } }
            }
        });

        await eventBus.publish('app/subteam.member_added', {
            subTeamId: id,
            subTeamName: subTeam.name,
            workspaceId: subTeam.workspaceId,
            membership,
            auditContext: {
                workspaceId: subTeam.workspaceId,
                userId: adminUserId,
                ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
                userAgent: req.headers["user-agent"]
            }
        }).catch(err => console.error('[addSubTeamMember] Event publication error:', err));

        return ApiResponse.created(res, {
            data: { membership },
            message: "Member added to sub-team"
        });
    } catch (err) {
        if (err.code === 'P2002') {
            throw new ConflictError("User is already a member of this sub-team");
        }
        throw err;
    }
});

// 6. Remove a member from a sub-team
export const removeSubTeamMember = asyncHandler(async (req, res) => {
    const adminUserId = req.user.id;
    const { id, userId } = req.params;

    const subTeam = await prisma.subTeam.findUnique({
        where: { id },
        include: { workspace: { include: { members: true } } }
    });

    if (!subTeam) {
        throw new NotFoundError("Sub-team not found");
    }

    const hasPermission = await hasWorkspacePermission(adminUserId, subTeam.workspaceId, 'manageSubTeams');

    if (!hasPermission) {
        throw new ForbiddenError("Only workspace owners or managers can manage sub-team members");
    }

    const targetMember = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true }
    });

    await prisma.subTeamMember.deleteMany({
        where: {
            subTeamId: id,
            userId
        }
    });

    await eventBus.publish('app/subteam.member_removed', {
        subTeamId: id,
        subTeamName: subTeam.name,
        workspaceId: subTeam.workspaceId,
        targetUserId: userId,
        targetUserName: targetMember?.name || userId,
        auditContext: {
            workspaceId: subTeam.workspaceId,
            userId: adminUserId,
            ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
            userAgent: req.headers["user-agent"]
        }
    }).catch(err => console.error('[removeSubTeamMember] Event publication error:', err));

    return ApiResponse.success(res, {
        message: "Member removed from sub-team successfully"
    });
});

export default {
    createSubTeam,
    getWorkspaceSubTeams,
    updateSubTeam,
    deleteSubTeam,
    addSubTeamMember,
    removeSubTeamMember
};
