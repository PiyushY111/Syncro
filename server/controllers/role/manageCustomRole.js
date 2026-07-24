import { prisma } from "../../config/prisma.js";
import { getUserWorkspaceRole, defaultPermissions } from "./checkPermissionHelper.js";
import { logAuditEvent } from "../../services/auditLogger.js";

export const createCustomRole = async (req, res) => {
    try {
        const userId = req.user.id;
        const targetWorkspaceId = req.params.workspaceId || req.body.workspaceId;
        const { roleName, description, color, permissions } = req.body;

        if (!targetWorkspaceId || !roleName) {
            return res.status(400).json({ message: "workspaceId and roleName are required" });
        }

        const { isOwner, workspace } = await getUserWorkspaceRole(userId, targetWorkspaceId);

        if (!workspace) return res.status(404).json({ message: "Workspace not found" });
        if (!isOwner) return res.status(403).json({ message: "Only the Workspace Owner can create custom roles." });

        const roleKey = roleName.toUpperCase().replace(/\s+/g, "_");

        const currentSettings = typeof workspace.settings === "object" && workspace.settings ? workspace.settings : {};
        const customRoles = currentSettings.customRoles || [];
        const rolePermissions = currentSettings.rolePermissions || { ...defaultPermissions };

        if (customRoles.some(r => r.key === roleKey) || ["ADMIN", "MANAGER", "MEMBER", "VIEWER", "OWNER"].includes(roleKey)) {
            return res.status(400).json({ message: "A role with this name already exists." });
        }

        const newRoleObj = {
            key: roleKey,
            label: roleName,
            description: description || "",
            color: color || "#8B5CF6"
        };

        const updatedSettings = {
            ...currentSettings,
            customRoles: [...customRoles, newRoleObj],
            rolePermissions: {
                ...rolePermissions,
                [roleKey]: permissions || defaultPermissions.MEMBER
            }
        };

        const updatedWorkspace = await prisma.workspace.update({
            where: { id: targetWorkspaceId },
            data: { settings: updatedSettings }
        });

        await logAuditEvent({
            workspaceId: targetWorkspaceId,
            userId,
            action: "CREATE",
            entityType: "WORKSPACE",
            entityId: roleKey,
            entityName: `Custom Role: ${roleName}`,
            severity: "CRITICAL",
            newState: newRoleObj,
            req
        });

        return res.status(201).json({
            message: "Custom role created successfully",
            settings: updatedWorkspace.settings
        });
    } catch (error) {
        console.error("Error creating custom role:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteCustomRole = async (req, res) => {
    try {
        const userId = req.user.id;
        const { workspaceId, roleKey } = req.params;

        const { isOwner, workspace } = await getUserWorkspaceRole(userId, workspaceId);
        if (!workspace) return res.status(404).json({ message: "Workspace not found" });
        if (!isOwner) return res.status(403).json({ message: "Only Workspace Owner can delete custom roles." });

        const currentSettings = typeof workspace.settings === "object" && workspace.settings ? workspace.settings : {};
        const customRoles = (currentSettings.customRoles || []).filter(r => r.key !== roleKey);
        const rolePermissions = { ...(currentSettings.rolePermissions || {}) };
        delete rolePermissions[roleKey];

        await prisma.workspaceMember.updateMany({
            where: { workspaceId, message: roleKey },
            data: { role: "MEMBER", message: "" }
        });

        const updatedWorkspace = await prisma.workspace.update({
            where: { id: workspaceId },
            data: { settings: { ...currentSettings, customRoles, rolePermissions } }
        });

        await logAuditEvent({
            workspaceId,
            userId,
            action: "DELETE",
            entityType: "WORKSPACE",
            entityId: roleKey,
            entityName: `Custom Role: ${roleKey}`,
            severity: "CRITICAL",
            previousState: { roleKey },
            req
        });

        return res.status(200).json({ message: "Custom role deleted successfully", settings: updatedWorkspace.settings });
    } catch (error) {
        console.error("Error deleting custom role:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
