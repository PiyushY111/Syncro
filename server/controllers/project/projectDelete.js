import { prisma } from '../../config/prisma.js';
import { hasWorkspacePermission } from '../role/checkPermissionHelper.js';
import { logAuditEvent } from '../../services/auditLogger.js';

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

        const hasDeletePerm = await hasWorkspacePermission(userId, project.workspaceId, 'deleteProject');
        const canDelete = hasDeletePerm || project.team_lead === userId;

        if (!canDelete) {
            return res.status(403).json({ message: "You do not have permission to delete this project" });
        }

        const previousState = { ...project };

        await prisma.project.delete({
            where: { id }
        });

        await logAuditEvent({
            workspaceId: project.workspaceId,
            userId,
            action: "DELETE",
            entityType: "PROJECT",
            entityId: id,
            entityName: project.name,
            previousState,
            req
        });

        return res.json({ id, message: "Project deleted successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
