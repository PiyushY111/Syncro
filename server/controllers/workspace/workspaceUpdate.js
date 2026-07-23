import { prisma } from '../../config/prisma.js';
import { createWorkspaceSlug } from './workspaceHelpers.js';

export const updateWorkspace = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { name, description, image_url } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({ message: 'Workspace name is required' });
        }

        const workspace = await prisma.workspace.findUnique({
            where: { id },
            include: { members: true }
        });

        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        const userMember = workspace.members.find(m => m.userId === userId);
        const userRole = userMember?.role || (workspace.ownerId === userId ? 'OWNER' : 'MEMBER');
        const isAuthorized = ['OWNER', 'ADMIN'].includes(userRole);
        
        if (!isAuthorized) {
            return res.status(403).json({ message: 'Only Admins or the Owner can update workspace settings' });
        }

        const updatedWorkspace = await prisma.workspace.update({
            where: { id },
            data: {
                name: name.trim(),
                slug: createWorkspaceSlug(name),
                description: description ? description.trim() : null,
                image_url: image_url !== undefined ? image_url.trim() : "",
            },
            include: {
                owner: true,
                members: { include: { user: true } },
                projects: {
                    include: {
                        tasks: { include: { assignee: true, comments: { include: { user: true } }, dependencies: true, blockedTasks: true } },
                        members: { include: { user: true } },
                    },
                },
            },
        });

        return res.json({ workspace: updatedWorkspace, message: 'Workspace updated successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};

export const deleteWorkspace = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const workspace = await prisma.workspace.findUnique({
            where: { id }
        });

        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        if (workspace.ownerId !== userId) {
            return res.status(403).json({ message: 'Only the Workspace Owner can delete this workspace' });
        }

        await prisma.workspace.delete({
            where: { id }
        });

        return res.json({ id, message: 'Workspace deleted successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.code || err.message });
    }
};
