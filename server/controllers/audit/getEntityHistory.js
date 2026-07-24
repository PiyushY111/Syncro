import { prisma } from "../../config/prisma.js";

export const getEntityHistory = async (req, res) => {
    try {
        const { entityType, entityId } = req.params;

        if (!entityType || !entityId) {
            return res.status(400).json({ message: "entityType and entityId are required" });
        }

        const history = await prisma.auditLog.findMany({
            where: {
                entityType: entityType.toUpperCase(),
                entityId
            },
            include: { user: { select: { id: true, name: true, email: true, image: true } } },
            orderBy: { createdAt: "desc" }
        });

        return res.status(200).json({ history });
    } catch (error) {
        console.error("Error fetching entity history:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
