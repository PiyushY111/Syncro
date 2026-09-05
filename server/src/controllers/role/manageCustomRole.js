import { prisma } from "../../config/prisma.js";
import { getUserWorkspaceRole, defaultPermissions, invalidateUserWorkspaceRoleCache } from "./checkPermissionHelper.js";
import { logAuditEvent } from "../../services/auditLogger.js";
import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from "../../utils/errors/appError.js";
import { ApiResponse } from "../../utils/response/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const createCustomRole = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const targetWorkspaceId = req.params.workspaceId || req.body.workspaceId;
    const { roleName, description, color, permissions } = req.body;

    if (!targetWorkspaceId || !roleName) {
        throw new BadRequestError("workspaceId and roleName are required");
    }

    const { role, isOwner, workspace } = await getUserWorkspaceRole(userId, targetWorkspaceId);

    if (!workspace) throw new NotFoundError("Workspace not found");

    const currentSettings = typeof workspace.settings === "object" && workspace.settings ? workspace.settings : {};
    const canAccessPortal = isOwner || (role === "MANAGER" && (currentSettings.allowManagerPortalAccess ?? false)) || role === "ADMIN";

    if (!canAccessPortal) {
        throw new ForbiddenError("You do not have permission to create custom roles.");
    }

    const roleKey = roleName.toUpperCase().replace(/\s+/g, "_");

    const customRoles = currentSettings.customRoles || [];
    const rolePermissions = currentSettings.rolePermissions || { ...defaultPermissions };

    if (customRoles.some(r => r.key === roleKey) || ["ADMIN", "MANAGER", "MEMBER", "VIEWER", "OWNER"].includes(roleKey)) {
        throw new ConflictError("A role with this name already exists.");
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

    return ApiResponse.created(res, {
        data: { settings: updatedWorkspace.settings },
        message: "Custom role created successfully"
    });
});

export const deleteCustomRole = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { workspaceId, roleKey } = req.params;

    const { role, isOwner, workspace } = await getUserWorkspaceRole(userId, workspaceId);
    if (!workspace) throw new NotFoundError("Workspace not found");

    const currentSettings = typeof workspace.settings === "object" && workspace.settings ? workspace.settings : {};
    const canAccessPortal = isOwner || (role === "MANAGER" && (currentSettings.allowManagerPortalAccess ?? false)) || role === "ADMIN";

    if (!canAccessPortal) {
        throw new ForbiddenError("You do not have permission to delete custom roles.");
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

    return ApiResponse.success(res, {
        data: { settings: updatedWorkspace.settings },
        message: "Custom role deleted successfully"
    });
});

