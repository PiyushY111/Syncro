import { prisma } from "../../config/prisma.js";
import { getUserWorkspaceRole } from "../role/checkPermissionHelper.js";

export const getAuditLogs = async (req, res) => {
    try {
        const userId = req.user.id;
        const { workspaceId } = req.params;
        const { entityType, severity, search, page, cursor, limit = 50 } = req.query;
        const take = Math.min(parseInt(limit) || 50, 100);

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

        const queryOptions = {
            where: whereClause,
            include: { user: { select: { id: true, name: true, email: true, image: true } } },
            orderBy: { createdAt: "desc" },
            take: take + 1
        };

        if (cursor) {
            queryOptions.cursor = { id: cursor };
            queryOptions.skip = 1;
        } else if (page) {
            queryOptions.skip = (parseInt(page) - 1) * take;
        }

        const [rawLogs, total] = await Promise.all([
            prisma.auditLog.findMany(queryOptions),
            prisma.auditLog.count({ where: whereClause })
        ]);

        const hasNextPage = rawLogs.length > take;
        const logs = hasNextPage ? rawLogs.slice(0, take) : rawLogs;
        const nextCursor = hasNextPage ? logs[logs.length - 1]?.id || null : null;

        return res.status(200).json({
            logs,
            total,
            nextCursor,
            page: page ? parseInt(page) : 1,
            totalPages: Math.ceil(total / take),
            isOwner,
            userRole: role
        });
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
