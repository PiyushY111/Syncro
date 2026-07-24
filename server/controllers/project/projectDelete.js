import { prisma } from '../../config/prisma.js';

// Delete Project
export const deleteProject = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

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

        const canDelete = ['OWNER', 'ADMIN'].includes(userRole) || project.team_lead === userId;

        if (!canDelete) {
            return res.status(403).json({ message: "You do not have permission to delete this project" });
        }

        await prisma.project.delete({
            where: { id }
        });

        return res.json({ id, message: "Project deleted successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
