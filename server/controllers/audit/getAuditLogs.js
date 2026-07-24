import { prisma } from "../../config/prisma.js";
import { getUserWorkspaceRole } from "../role/checkPermissionHelper.js";

export const getAuditLogs = async (req, res) => {
    try {
        const userId = req.user.id;
        const { workspaceId } = req.params;
        const { entityType, severity, search, page = 1, limit = 50 } = req.query;

        const { role, isOwner, workspace } = await getUserWorkspaceRole(userId, workspaceId);
        if (!workspace) return res.status(404).json({ message: "Workspace not found" });

        const canView = isOwner || role === "ADMIN" || role === "MANAGER";
        if (!canView) {
            return res.status(403).json({ message: "Audit logs are only accessible to Owner, Admin, and Manager." });
        }

        const whereClause = { workspaceId };
        if (entityType && entityType !== "ALL") whereClause.entityType = entityType;
        if (severity && severity !== "ALL") whereClause.severity = severity;
        if (search?.trim()) {
            whereClause.OR = [
                { entityName: { contains: search, mode: "insensitive" } },
                { user: { name: { contains: search, mode: "insensitive" } } }
            ];
        }

        const take = parseInt(limit);
        const skip = (parseInt(page) - 1) * take;

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where: whereClause,
                include: { user: { select: { id: true, name: true, email: true, image: true } } },
                orderBy: { createdAt: "desc" },
                skip,
                take
            }),
            prisma.auditLog.count({ where: whereClause })
        ]);

        return res.status(200).json({
            logs,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / take),
            isOwner,
            userRole: role
        });
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
