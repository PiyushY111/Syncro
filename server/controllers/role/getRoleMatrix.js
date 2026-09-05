import { prisma } from "../../config/prisma.js";
import { getUserWorkspaceRole, defaultPermissions } from "./checkPermissionHelper.js";
import { NotFoundError, ForbiddenError } from "../../utils/errors/appError.js";
import { ApiResponse } from "../../utils/response/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getRoleMatrix = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { workspaceId } = req.params;

    const { role, isOwner, workspace } = await getUserWorkspaceRole(userId, workspaceId);

    if (!workspace) {
        throw new NotFoundError("Workspace not found");
    }

    const settings = typeof workspace.settings === "object" && workspace.settings ? workspace.settings : {};
    const allowManagerPortalAccess = settings.allowManagerPortalAccess ?? false;

    const canAccessPortal = isOwner || (role === "MANAGER" && allowManagerPortalAccess) || (role === "ADMIN");

    if (!canAccessPortal) {
        throw new ForbiddenError("Role Portal is only accessible to Workspace Owner (or Manager if allowed).");
    }

    const savedRoleMatrix = settings.rolePermissions || {};
    const customRoles = settings.customRoles || [];

    // Hydrate complete matrix with default permissions for standard roles and populated custom roles
    const roleMatrix = {
        ...defaultPermissions,
        ...savedRoleMatrix
    };

    // Ensure every custom role has a permission entry
    customRoles.forEach(c => {
        if (!roleMatrix[c.key]) {
            roleMatrix[c.key] = { ...defaultPermissions.MEMBER };
        }
    });

    const members = await prisma.workspaceMember.findMany({
        where: { workspaceId },
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
        orderBy: { role: "asc" }
    });

    const formattedMembers = members.map(m => ({
        ...m,
        role: m.customRole || m.role
    }));

    return res.status(200).json({
        success: true,
        roleMatrix,
        customRoles,
        allowManagerPortalAccess,
        userRole: role,
        isOwner,
        canManagePortal: canAccessPortal,
        members: formattedMembers
    });
});
