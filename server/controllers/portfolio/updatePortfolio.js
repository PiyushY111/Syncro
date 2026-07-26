import { prisma } from "../../config/prisma.js";
import { logAuditEvent } from "../../services/auditLogger.js";

export const updatePortfolio = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, color, icon, status } = req.body;

        const previousState = await prisma.portfolio.findUnique({
            where: { id },
            include: {
                projects: { include: { project: true } },
                owner: true
            }
        });

        if (!previousState) {
            return res.status(404).json({ message: "Portfolio not found" });
        }

        const dataToUpdate = {};
        if (name !== undefined) dataToUpdate.name = name;
        if (description !== undefined) dataToUpdate.description = description;
        if (color !== undefined) dataToUpdate.color = color;
        if (icon !== undefined) dataToUpdate.icon = icon;
        if (status !== undefined) dataToUpdate.status = status;

        const updated = await prisma.portfolio.update({
            where: { id },
            data: dataToUpdate,
            include: {
                projects: { include: { project: true } },
                owner: true
            }
        });

        await logAuditEvent({
            workspaceId: previousState.workspaceId,
            userId: req.user.id,
            action: "UPDATE",
            entityType: "PORTFOLIO",
            entityId: id,
            entityName: updated.name,
            previousState,
            newState: updated,
            req
        });

        return res.status(200).json({
            message: "Portfolio updated successfully",
            portfolio: updated
        });
    } catch (error) {
        console.error("Error updating portfolio:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
