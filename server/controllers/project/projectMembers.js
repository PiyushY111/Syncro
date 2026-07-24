import { prisma } from "../../config/prisma.js";

// Add member to project
export const addMember = async (req, res) => {
    try {
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
            return res.status(404).json({ message: "Project not found" });
        }

        const workspaceMembers = project.workspace.members;
        const userMember = workspaceMembers.find(m => m.userId === userId);
        const userRole = userMember?.role || (project.workspace.ownerId === userId ? 'OWNER' : 'MEMBER');
        const hasWorkspacePermission = ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole);

        if (project.team_lead !== userId && !hasWorkspacePermission) {
            return res.status(403).json({ message: "You do not have permission to add members to this project" });
        }

        const existingMember = project.members.find((member) => member.user.email === email);
        if (existingMember) {
            return res.status(400).json({ message: "User is already a member of this project" });
        }
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const member = await prisma.projectMember.create({
            data: {
                userId: user.id,
                projectId,
            }
        });
        return res.status(201).json({ member, message: "Member added successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const updateProjectStages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { stages } = req.body;

        if (!Array.isArray(stages) || stages.length === 0) {
            return res.status(400).json({ message: "stages must be a non-empty array of strings" });
        }

        const project = await prisma.project.findUnique({
            where: { id },
            include: { workspace: { include: { members: true } } }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const workspaceMembers = project.workspace.members;
        const userMember = workspaceMembers.find(m => m.userId === userId);
        const userRole = userMember?.role || (project.workspace.ownerId === userId ? 'OWNER' : 'MEMBER');
        const hasPermission = ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole) || project.team_lead === userId;

        if (!hasPermission) {
            return res.status(403).json({ message: "You do not have permission to configure stages for this project" });
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
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
