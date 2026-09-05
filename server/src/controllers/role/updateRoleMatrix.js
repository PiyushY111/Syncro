import { prisma } from "../../config/prisma.js";
import { getUserWorkspaceRole, invalidateUserWorkspaceRoleCache } from "./checkPermissionHelper.js";
import { NotFoundError, ForbiddenError } from "../../utils/errors/appError.js";
import { ApiResponse } from "../../utils/response/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const updateRoleMatrix = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { workspaceId } = req.params;
    const { roleMatrix, allowManagerPortalAccess } = req.body;

    const { role, isOwner, workspace } = await getUserWorkspaceRole(userId, workspaceId);

    if (!workspace) {
        throw new NotFoundError("Workspace not found");
    }

    const currentSettings = typeof workspace.settings === "object" && workspace.settings ? workspace.settings : {};
    const canAccessPortal = isOwner || (role === "MANAGER" && (currentSettings.allowManagerPortalAccess ?? false)) || role === "ADMIN";

    if (!canAccessPortal) {
        throw new ForbiddenError("You do not have permission to modify role permissions.");
    }

    const mergedRolePermissions = {
        ...(currentSettings.rolePermissions || {}),
        ...(roleMatrix || {})
    };

    const updatedSettings = {
        ...currentSettings,
        rolePermissions: mergedRolePermissions,
        allowManagerPortalAccess: allowManagerPortalAccess !== undefined ? allowManagerPortalAccess : (currentSettings.allowManagerPortalAccess ?? false)
    };

    const updatedWorkspace = await prisma.workspace.update({
        where: { id: workspaceId },
        data: { settings: updatedSettings }
    });

    await invalidateUserWorkspaceRoleCache(userId, workspaceId);

    return ApiResponse.success(res, {
        data: { settings: updatedWorkspace.settings },
        message: "Role matrix updated successfully"
    });
});

