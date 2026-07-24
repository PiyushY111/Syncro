import { prisma } from "../../config/prisma.js";
import { getUserWorkspaceRole } from "../role/checkPermissionHelper.js";

export const deleteAuditLogs = async (req, res) => {
    try {
        const userId = req.user.id;
        const { workspaceId } = req.params;
        const { severityFilter, olderThanDays } = req.body;

        const { isOwner } = await getUserWorkspaceRole(userId, workspaceId);
        if (!isOwner) {
            return res.status(403).json({ message: "Only the Workspace OWNER can delete or purge audit history." });
        }

        const whereClause = { workspaceId };
        if (severityFilter && severityFilter !== "ALL") {
            whereClause.severity = severityFilter;
        }

        if (olderThanDays) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThanDays));
            whereClause.createdAt = { lt: cutoffDate };
        }

        const deleteResult = await prisma.auditLog.deleteMany({
            where: whereClause
        });

        return res.status(200).json({
            message: `Successfully purged ${deleteResult.count} audit log entries`,
            count: deleteResult.count
        });
    } catch (error) {
        console.error("Error purging audit logs:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
