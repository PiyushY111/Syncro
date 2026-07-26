import { prisma } from "../../config/prisma.js";
import { hasWorkspacePermission } from "../role/checkPermissionHelper.js";
import { logAuditEvent } from "../../services/auditLogger.js";

// Update Project
export const updateProject = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id, workspaceId, description, name, status, start_date, end_date, team_members, team_lead, progress, priority } = req.body;

        if (!id) {
            return res.status(400).json({ message: "id is required!" });
        }
        if (!workspaceId) {
            return res.status(400).json({ message: "workspaceId is required!" });
        }
        if (!name) {
            return res.status(400).json({ message: "name is required!" });
        }
        if (!team_lead) {
            return res.status(400).json({ message: "team_lead is required!" });
        }

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: { include: { user: true } } }
        });

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }
        
        const hasEditPerm = await hasWorkspacePermission(userId, workspaceId, 'editProject');

        if (!hasEditPerm) {
            const project = await prisma.project.findUnique({
                where: { id }
            });
            if (!project) {
                return res.status(404).json({ message: "Project not found" });
            } else if (project.team_lead !== userId) {
                return res.status(403).json({ message: "You do not have permission to update this project" });
            }
        }

        let resolvedTeamLeadId;
        if (team_lead.includes('@')) {
            const user = await prisma.user.findUnique({ where: { email: team_lead.toLowerCase().trim() } });
            if (!user) {
                return res.status(404).json({ message: "Team lead not found" });
            }
            resolvedTeamLeadId = user.id;
        } else {
            const user = await prisma.user.findUnique({ where: { id: team_lead } });
            if (!user) {
                return res.status(404).json({ message: "Team lead not found" });
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
                priority
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

        await logAuditEvent({
            workspaceId,
            userId,
            action: "UPDATE",
            entityType: "PROJECT",
            entityId: id,
            entityName: name,
            previousState,
            newState: projectWithMembers,
            req
        });

        return res.status(200).json({ project: projectWithMembers, message: "Project updated successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
