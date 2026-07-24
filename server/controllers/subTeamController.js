import { prisma } from '../config/prisma.js';

// 1. Create a sub-team
export const createSubTeam = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, description = '', workspaceId } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({ message: "Sub-team name is required" });
        }
        if (!workspaceId) {
            return res.status(400).json({ message: "workspaceId is required" });
        }

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: true }
        });

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        // Check if user is Workspace Owner/Admin/Manager
        const member = workspace.members.find(m => m.userId === userId);
        const userRole = member?.role || (workspace.ownerId === userId ? 'OWNER' : 'MEMBER');
        const hasPermission = ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole);

        if (!hasPermission) {
            return res.status(403).json({ message: "Only workspace owners or managers can create sub-teams" });
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

        return res.status(201).json({ subTeam, message: "Sub-team created successfully" });
    } catch (err) {
        console.error("[CREATE SUBTEAM ERROR]", err);
        return res.status(500).json({ message: err.message });
    }
};

// 2. Get workspace sub-teams
export const getWorkspaceSubTeams = async (req, res) => {
    try {
        const userId = req.user.id;
        const { workspaceId } = req.params;

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: true }
        });

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        // Verify membership
        const isMember = workspace.members.some(m => m.userId === userId) || workspace.ownerId === userId;
        if (!isMember) {
            return res.status(403).json({ message: "Access restricted" });
        }

        const subTeams = await prisma.subTeam.findMany({
            where: { workspaceId },
            include: {
                members: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
                project: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        return res.json({ subTeams });
    } catch (err) {
        console.error("[GET SUBTEAMS ERROR]", err);
        return res.status(500).json({ message: err.message });
    }
};

// 3. Update sub-team details or project assignment
export const updateSubTeam = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { name, description, projectId } = req.body;

        const subTeam = await prisma.subTeam.findUnique({
            where: { id },
            include: { workspace: { include: { members: true } } }
        });

        if (!subTeam) {
            return res.status(404).json({ message: "Sub-team not found" });
        }

        const workspace = subTeam.workspace;
        const member = workspace.members.find(m => m.userId === userId);
        const userRole = member?.role || (workspace.ownerId === userId ? 'OWNER' : 'MEMBER');
        const hasPermission = ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole);

        if (!hasPermission) {
            return res.status(403).json({ message: "Only workspace owners or managers can modify sub-teams" });
        }

        // Validate project if we are assigning one
        if (projectId) {
            const project = await prisma.project.findUnique({ where: { id: projectId } });
            if (!project) {
                return res.status(404).json({ message: "Project not found" });
            }
            if (project.workspaceId !== subTeam.workspaceId) {
                return res.status(400).json({ message: "Project must belong to the same workspace as the sub-team" });
            }
        }

        const updated = await prisma.subTeam.update({
            where: { id },
            data: {
                name: name !== undefined ? name.trim() : subTeam.name,
                description: description !== undefined ? description.trim() || null : subTeam.description,
                projectId: projectId !== undefined ? projectId || null : subTeam.projectId
            },
            include: {
                members: { include: { user: true } },
                project: true
            }
        });

        return res.json({ subTeam: updated, message: "Sub-team updated successfully" });
    } catch (err) {
        console.error("[UPDATE SUBTEAM ERROR]", err);
        return res.status(500).json({ message: err.message });
    }
};

// 4. Delete a sub-team
export const deleteSubTeam = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const subTeam = await prisma.subTeam.findUnique({
            where: { id },
            include: { workspace: { include: { members: true } } }
        });

        if (!subTeam) {
            return res.status(404).json({ message: "Sub-team not found" });
        }

        const workspace = subTeam.workspace;
        const member = workspace.members.find(m => m.userId === userId);
        const userRole = member?.role || (workspace.ownerId === userId ? 'OWNER' : 'MEMBER');
        const hasPermission = ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole);

        if (!hasPermission) {
            return res.status(403).json({ message: "Only workspace owners or managers can delete sub-teams" });
        }

        await prisma.subTeam.delete({ where: { id } });

        return res.json({ message: "Sub-team deleted successfully" });
    } catch (err) {
        console.error("[DELETE SUBTEAM ERROR]", err);
        return res.status(500).json({ message: err.message });
    }
};

// 5. Add a member to a sub-team
export const addSubTeamMember = async (req, res) => {
    try {
        const adminUserId = req.user.id;
        const { id } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        const subTeam = await prisma.subTeam.findUnique({
            where: { id },
            include: { workspace: { include: { members: true } } }
        });

        if (!subTeam) {
            return res.status(404).json({ message: "Sub-team not found" });
        }

        const workspace = subTeam.workspace;
        const member = workspace.members.find(m => m.userId === adminUserId);
        const userRole = member?.role || (workspace.ownerId === adminUserId ? 'OWNER' : 'MEMBER');
        const hasPermission = ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole);

        if (!hasPermission) {
            return res.status(403).json({ message: "Only workspace owners or managers can manage sub-team members" });
        }

        // Check if target user is in the workspace
        const targetInWorkspace = workspace.members.some(m => m.userId === userId) || workspace.ownerId === userId;
        if (!targetInWorkspace) {
            return res.status(400).json({ message: "User must be a member of this workspace" });
        }

        const membership = await prisma.subTeamMember.create({
            data: {
                subTeamId: id,
                userId
            },
            include: {
                user: { select: { id: true, name: true, email: true, image: true } }
            }
        });

        return res.status(201).json({ membership, message: "Member added to sub-team" });
    } catch (err) {
        console.error("[ADD SUBTEAM MEMBER ERROR]", err);
        if (err.code === 'P2002') {
            return res.status(400).json({ message: "User is already a member of this sub-team" });
        }
        return res.status(500).json({ message: err.message });
    }
};

// 6. Remove a member from a sub-team
export const removeSubTeamMember = async (req, res) => {
    try {
        const adminUserId = req.user.id;
        const { id, userId } = req.params;

        const subTeam = await prisma.subTeam.findUnique({
            where: { id },
            include: { workspace: { include: { members: true } } }
        });

        if (!subTeam) {
            return res.status(404).json({ message: "Sub-team not found" });
        }

        const workspace = subTeam.workspace;
        const member = workspace.members.find(m => m.userId === adminUserId);
        const userRole = member?.role || (workspace.ownerId === adminUserId ? 'OWNER' : 'MEMBER');
        const hasPermission = ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole);

        if (!hasPermission) {
            return res.status(403).json({ message: "Only workspace owners or managers can manage sub-team members" });
        }

        await prisma.subTeamMember.deleteMany({
            where: {
                subTeamId: id,
                userId
            }
        });

        return res.json({ message: "Member removed from sub-team successfully" });
    } catch (err) {
        console.error("[REMOVE SUBTEAM MEMBER ERROR]", err);
        return res.status(500).json({ message: err.message });
    }
};
