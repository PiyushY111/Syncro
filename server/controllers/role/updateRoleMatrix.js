import { prisma } from "../../config/prisma.js";
import { getUserWorkspaceRole } from "./checkPermissionHelper.js";

export const updateRoleMatrix = async (req, res) => {
    try {
        const userId = req.user.id;
        const { workspaceId } = req.params;
        const { roleMatrix, allowManagerPortalAccess } = req.body;

        const { isOwner, workspace } = await getUserWorkspaceRole(userId, workspaceId);

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        if (!isOwner) {
            return res.status(403).json({ message: "Only the Workspace Owner can modify role permissions." });
        }

        const currentSettings = typeof workspace.settings === "object" && workspace.settings ? workspace.settings : {};

        const updatedSettings = {
            ...currentSettings,
            rolePermissions: roleMatrix || currentSettings.rolePermissions,
            allowManagerPortalAccess: allowManagerPortalAccess !== undefined ? allowManagerPortalAccess : (currentSettings.allowManagerPortalAccess ?? false)
        };

        const updatedWorkspace = await prisma.workspace.update({
            where: { id: workspaceId },
            data: { settings: updatedSettings }
        });

        return res.status(200).json({
            message: "Role matrix updated successfully",
            settings: updatedWorkspace.settings
        });
    } catch (error) {
        console.error("Error updating role matrix:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
