import { prisma } from "../../config/prisma.js";
import { getUserWorkspaceRole, defaultPermissions, invalidateUserWorkspaceRoleCache } from "./checkPermissionHelper.js";
import { logAuditEvent } from "../../services/auditLogger.js";

export const createCustomRole = async (req, res) => {
    try {
        const userId = req.user.id;
        const targetWorkspaceId = req.params.workspaceId || req.body.workspaceId;
        const { roleName, description, color, permissions } = req.body;

        if (!targetWorkspaceId || !roleName) {
            return res.status(400).json({ message: "workspaceId and roleName are required" });
        }

        const { role, isOwner, workspace } = await getUserWorkspaceRole(userId, targetWorkspaceId);

        if (!workspace) return res.status(404).json({ message: "Workspace not found" });

        const currentSettings = typeof workspace.settings === "object" && workspace.settings ? workspace.settings : {};
        const canAccessPortal = isOwner || (role === "MANAGER" && (currentSettings.allowManagerPortalAccess ?? false)) || role === "ADMIN";

        if (!canAccessPortal) {
            return res.status(403).json({ message: "You do not have permission to create custom roles." });
        }

        const roleKey = roleName.toUpperCase().replace(/\s+/g, "_");

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

        const initialRolePerms = {
            ...defaultPermissions.MEMBER,
            ...(permissions || {})
        };

        const updatedSettings = {
            ...currentSettings,
            customRoles: [...customRoles, newRoleObj],
            rolePermissions: {
                ...rolePermissions,
                [roleKey]: initialRolePerms
            }
        };

        const updatedWorkspace = await prisma.workspace.update({
            where: { id: targetWorkspaceId },
            data: { settings: updatedSettings }
        });

        await invalidateUserWorkspaceRoleCache(userId, targetWorkspaceId);

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

        const { role, isOwner, workspace } = await getUserWorkspaceRole(userId, workspaceId);
        if (!workspace) return res.status(404).json({ message: "Workspace not found" });

        const currentSettings = typeof workspace.settings === "object" && workspace.settings ? workspace.settings : {};
        const canAccessPortal = isOwner || (role === "MANAGER" && (currentSettings.allowManagerPortalAccess ?? false)) || role === "ADMIN";

        if (!canAccessPortal) {
            return res.status(403).json({ message: "You do not have permission to delete custom roles." });
        }

        const customRoles = (currentSettings.customRoles || []).filter(r => r.key !== roleKey);
        const rolePermissions = { ...(currentSettings.rolePermissions || {}) };
        delete rolePermissions[roleKey];

        const affectedMembers = await prisma.workspaceMember.findMany({
            where: { workspaceId, customRole: roleKey },
            select: { userId: true }
        });

        await prisma.workspaceMember.updateMany({
            where: { workspaceId, customRole: roleKey },
            data: { role: "MEMBER", customRole: "" }
        });

        const updatedWorkspace = await prisma.workspace.update({
            where: { id: workspaceId },
            data: { settings: { ...currentSettings, customRoles, rolePermissions } }
        });

        for (const m of affectedMembers) {
            await invalidateUserWorkspaceRoleCache(m.userId, workspaceId);
        }
        await invalidateUserWorkspaceRoleCache(userId, workspaceId);

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

