import { prisma } from "../../config/prisma.js";
import { getUserWorkspaceRole } from "./checkPermissionHelper.js";
import { logAuditEvent } from "../../services/auditLogger.js";

export const updateMemberRole = async (req, res) => {
    try {
        const userId = req.user.id;
        const { workspaceId, targetUserId, newRole } = req.body;

        if (!workspaceId || !targetUserId || !newRole) {
            return res.status(400).json({ message: "workspaceId, targetUserId, and newRole are required" });
        }

        const { isOwner, role } = await getUserWorkspaceRole(userId, workspaceId);

        if (!isOwner && role !== "ADMIN") {
            return res.status(403).json({ message: "Only Owner or Admin can change member roles." });
        }

        const member = await prisma.workspaceMember.findUnique({
            where: { userId_workspaceId: { userId: targetUserId, workspaceId } }
        });

        if (!member) {
            return res.status(404).json({ message: "Workspace member not found" });
        }

        const standardRoles = ["ADMIN", "MANAGER", "MEMBER", "VIEWER"];
        const isStandard = standardRoles.includes(newRole);

        const updateData = isStandard
            ? { role: newRole, customRole: "" }
            : { role: "MEMBER", customRole: newRole };

        const updatedMember = await prisma.workspaceMember.update({
            where: { id: member.id },
            data: updateData,
            include: { user: { select: { id: true, name: true, email: true, image: true } } }
        });

        await logAuditEvent({
            workspaceId,
            userId,
            action: "ROLE_CHANGE",
            entityType: "USER",
            entityId: targetUserId,
            entityName: updatedMember.user?.name || "Member",
            severity: "CRITICAL",
            previousState: { role: member.customRole || member.role },
            newState: { role: newRole },
            req
        });

        return res.status(200).json({
            message: "Member role updated successfully",
            member: {
                ...updatedMember,
                role: updatedMember.customRole || updatedMember.role
            }
        });
    } catch (error) {
        console.error("Error updating member role:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
