import { prisma } from "../../config/prisma.js";
import { hasWorkspacePermission } from "../role/checkPermissionHelper.js";
import { eventBus } from "../../services/eventBus.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from "../../utils/errors/appError.js";

// Update Project
export const updateProject = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id, workspaceId, description, name, status, start_date, end_date, team_members, team_lead, progress, priority } = req.body;

    if (!id) {
        throw new BadRequestError("id is required!");
    }
    if (!workspaceId) {
        throw new BadRequestError("workspaceId is required!");
    }
    if (!name) {
        throw new BadRequestError("name is required!");
    }
    if (!team_lead) {
        throw new BadRequestError("team_lead is required!");
    }

    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: { members: { include: { user: true } } }
    });

    if (!workspace) {
        throw new NotFoundError("Workspace not found");
    }
    
    const hasEditPerm = await hasWorkspacePermission(userId, workspaceId, 'editProject');

    if (!hasEditPerm) {
        const project = await prisma.project.findUnique({
            where: { id }
        });
        if (!project) {
            throw new NotFoundError("Project not found");
        } else if (project.team_lead !== userId) {
            throw new ForbiddenError("You do not have permission to update this project");
        }
    }

    let resolvedTeamLeadId;
    if (team_lead.includes('@')) {
        const user = await prisma.user.findUnique({ where: { email: team_lead.toLowerCase().trim() } });
        if (!user) {
            throw new NotFoundError("Team lead not found");
        }
        resolvedTeamLeadId = user.id;
    } else {
        const user = await prisma.user.findUnique({ where: { id: team_lead } });
        if (!user) {
            throw new NotFoundError("Team lead not found");
        }
        resolvedTeamLeadId = user.id;
    }

    const previousState = await prisma.project.findUnique({
        where: { id },
        include: {
            owner: true,
            members: { include: { user: true } },
            tasks: { include: { assignee: true, comments: { include: { user: true } }, dependencies: true, blockedTasks: true } }
        }
    });

    if (!previousState) {
        throw new NotFoundError("Project not found");
    }

    const expectedVersion = req.body.expectedVersion !== undefined ? Number(req.body.expectedVersion) : undefined;
    if (expectedVersion !== undefined && previousState.version !== expectedVersion) {
        throw new ConflictError("Conflict: Project was modified by another user. Please refresh and try again.");
    }

    await prisma.project.update({
        where: { id },
        data: {
            workspaceId,
            name,
            description,
            status,
            start_date: start_date ? new Date(start_date) : null,
            end_date: end_date ? new Date(end_date) : null,
            team_lead: resolvedTeamLeadId,
            progress,
            priority,
            version: { increment: 1 }
        }
    });

    if (Array.isArray(team_members)) {
        await prisma.projectMember.deleteMany({
            where: { projectId: id }
        });
        
        const membersToAdd = [];
        workspace.members.forEach((member) => {
            if (team_members.includes(member.user.email)) {
                membersToAdd.push(member.user.id);
            }
        });
        if (membersToAdd.length > 0) {
            await prisma.projectMember.createMany({
                data: membersToAdd.map(memberId => ({
                    projectId: id,
                    userId: memberId
                })),
            });
        }
    }

    const projectWithMembers = await prisma.project.findUnique({
        where: { id },
        include: {
            owner: true,
            members: { include: { user: true } },
            tasks: { include: { assignee: true, comments: { include: { user: true } }, dependencies: true, blockedTasks: true } }
        }
    });

    await eventBus.publish('app/project.updated', {
        project: projectWithMembers,
        previousState,
        workspaceId,
        auditContext: {
            workspaceId,
            userId,
            ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
            userAgent: req.headers["user-agent"]
        }
    });

    return res.status(200).json({ project: projectWithMembers, message: "Project updated successfully" });
});
