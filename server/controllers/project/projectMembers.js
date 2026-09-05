import { prisma } from "../../config/prisma.js";
import { getUserWorkspaceRole, hasWorkspacePermission } from "../role/checkPermissionHelper.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { BadRequestError, NotFoundError, ForbiddenError } from "../../utils/errors/appError.js";

// Add member to project
export const addMember = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { projectId } = req.params;
    const { email } = req.body;

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { 
            members: { include: { user: true } },
            workspace: { include: { members: true } }
        }
    });

    if (!project) {
        throw new NotFoundError("Project not found");
    }

    const { role, isOwner } = await getUserWorkspaceRole(userId, project.workspaceId);
    const canManageMembers = await hasWorkspacePermission(userId, project.workspaceId, "manageMembers");
    const hasWorkspacePermissionVal = isOwner || ['ADMIN', 'MANAGER'].includes(role) || canManageMembers;

    if (project.team_lead !== userId && !hasWorkspacePermissionVal) {
        throw new ForbiddenError("You do not have permission to add members to this project");
    }

    const existingMember = project.members.find((member) => member.user.email === email);
    if (existingMember) {
        throw new BadRequestError("User is already a member of this project");
    }
    const user = await prisma.user.findUnique({
        where: { email }
    });
    if (!user) {
        throw new NotFoundError("User not found");
    }

    const member = await prisma.projectMember.create({
        data: {
            userId: user.id,
            projectId,
        }
    });
    return res.status(201).json({ member, message: "Member added successfully" });
});

export const updateProjectStages = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { stages } = req.body;

    if (!Array.isArray(stages) || stages.length === 0) {
        throw new BadRequestError("stages must be a non-empty array of strings");
    }

    const project = await prisma.project.findUnique({
        where: { id },
        include: { workspace: { include: { members: true } } }
    });

    if (!project) {
        throw new NotFoundError("Project not found");
    }

    const { role, isOwner } = await getUserWorkspaceRole(userId, project.workspaceId);
    const hasPermission = isOwner || ['ADMIN', 'MANAGER'].includes(role) || project.team_lead === userId;

    if (!hasPermission) {
        throw new ForbiddenError("You do not have permission to configure stages for this project");
    }

    const formattedStages = stages.map(s => s.trim()).filter(Boolean);

    await prisma.task.updateMany({
        where: {
            projectId: id,
            NOT: {
                status: { in: formattedStages }
            }
        },
        data: {
            status: "TODO"
        }
    });

    const updatedProject = await prisma.project.update({
        where: { id },
        data: {
            stages: formattedStages.join(","),
        },
        include: {
            owner: true,
            members: { include: { user: true } },
            tasks: { include: { assignee: true, comments: { include: { user: true } }, dependencies: true, blockedTasks: true } }
        }
    });

    return res.json({ project: updatedProject, message: "Project stages updated successfully" });
});
