import { prisma } from "../../config/prisma.js";
import { getUserWorkspaceRole, defaultPermissions } from "./checkPermissionHelper.js";

export const getRoleMatrix = async (req, res) => {
    try {
        const userId = req.user.id;
        const { workspaceId } = req.params;

        const { role, isOwner, workspace } = await getUserWorkspaceRole(userId, workspaceId);

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const settings = typeof workspace.settings === "object" && workspace.settings ? workspace.settings : {};
        const allowManagerPortalAccess = settings.allowManagerPortalAccess ?? false;

        const canAccessPortal = isOwner || (role === "MANAGER" && allowManagerPortalAccess) || (role === "ADMIN");

        if (!canAccessPortal) {
            return res.status(403).json({ message: "Role Portal is only accessible to Workspace Owner (or Manager if allowed)." });
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
            roleMatrix,
            customRoles,
            allowManagerPortalAccess,
            userRole: role,
            isOwner,
            canManagePortal: canAccessPortal,
            members: formattedMembers
        });

    } catch (error) {
        console.error("Error fetching role matrix:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
