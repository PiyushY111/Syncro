import { prisma } from "../../config/prisma.js";

export const defaultPermissions = {
    ADMIN: { 
        createProject: true, editProject: true, deleteProject: true, 
        createTasks: true, editTasks: true, deleteTasks: true, 
        manageMilestones: true, managePortfolios: true, viewAnalytics: true, 
        manageMembers: true, manageWhiteboards: true, manageChannels: true, manageSubTeams: true 
    },
    MANAGER: { 
        createProject: true, editProject: true, deleteProject: false, 
        createTasks: true, editTasks: true, deleteTasks: true, 
        manageMilestones: true, managePortfolios: true, viewAnalytics: true, 
        manageMembers: false, manageWhiteboards: true, manageChannels: true, manageSubTeams: true 
    },
    MEMBER: { 
        createProject: false, editProject: false, deleteProject: false, 
        createTasks: true, editTasks: true, deleteTasks: false, 
        manageMilestones: false, managePortfolios: false, viewAnalytics: true, 
        manageMembers: false, manageWhiteboards: true, manageChannels: false, manageSubTeams: false 
    },
    VIEWER: { 
        createProject: false, editProject: false, deleteProject: false, 
        createTasks: false, editTasks: false, deleteTasks: false, 
        manageMilestones: false, managePortfolios: false, viewAnalytics: true, 
        manageMembers: false, manageWhiteboards: false, manageChannels: false, manageSubTeams: false 
    }
};

export const getUserWorkspaceRole = async (userId, workspaceId) => {
    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: { members: true }
    });

    if (!workspace) return { role: null, isOwner: false, workspace: null };

    const isOwner = workspace.ownerId === userId;
    if (isOwner) return { role: "OWNER", isOwner: true, workspace };

    const member = workspace.members.find(m => m.userId === userId);
    const activeRole = member?.customRole || member?.role || "MEMBER";
    return { role: activeRole, isOwner: false, workspace, member };
};

export const hasWorkspacePermission = async (userId, workspaceId, permissionKey) => {
    const { role, isOwner, workspace } = await getUserWorkspaceRole(userId, workspaceId);
    if (!workspace) return false;
    if (isOwner) return true;

    const settings = typeof workspace.settings === "object" && workspace.settings ? workspace.settings : {};
    const rolePermissions = settings.rolePermissions || defaultPermissions;
    const permissions = rolePermissions[role] || defaultPermissions[role] || defaultPermissions.MEMBER;

    return permissions[permissionKey] ?? false;
};

