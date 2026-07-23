import { prisma } from "../../config/prisma.js";

// Create Project
export const createProject = async (req, res) => {
    try {
        const userId = req.user.id;
        const { workspaceId, description, name, status, start_date, end_date, team_members, team_lead, progress, priority } = req.body;

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
            return res.status(404).json({ message: "WorkSpace not found" });
        }
        const userMember = workspace.members.find((member) => member.userId === userId);
        const userRole = userMember?.role || (workspace.ownerId === userId ? 'OWNER' : 'MEMBER');
        const canCreate = ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole);

        if (!canCreate) {
            return res.status(403).json({ message: "You do not have permission to create a project in this workspace" });
        }

        const teamLead = await prisma.user.findUnique({
            where: { email: team_lead },
            select: { id: true }
        });

        if (!teamLead) {
            return res.status(404).json({ message: "Team lead not found" });
        }

        const project = await prisma.project.create({
            data: {
                name,
                description,
                status,
                start_date: start_date ? new Date(start_date) : null,
                end_date: end_date ? new Date(end_date) : null,
                progress,
                priority,
                workspace: { connect: { id: workspaceId } },
                owner: { connect: { id: teamLead?.id } },
            },
        });

        if (team_members && team_members.length > 0) {
            const membersToAdd = [];
            workspace.members.forEach((member) => {
                if (team_members.includes(member.user.email)) {
                    membersToAdd.push(member.user.id);
                }
            });
            await prisma.projectMember.createMany({
                data: membersToAdd.map(memberId => ({
                    projectId: project.id,
                    userId: memberId
                })),
            });
        }

        const projectWithMembers = await prisma.project.findUnique({
            where: { id: project.id },
            include: {
                owner: true,
                members: { include: { user: true } },
                tasks: { include: { assignee: true, comments: { include: { user: true } }, dependencies: true, blockedTasks: true } }
            }
        });

        return res.status(201).json({ message: "Project created successfully", project: projectWithMembers });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
