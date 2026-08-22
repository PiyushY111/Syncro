import { prisma } from "../../config/prisma.js";
import { redisCache } from "../../config/redis.js";

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
    const cacheKey = `workspace:role:${userId}:${workspaceId}`;
    try {
        const cached = await redisCache.get(cacheKey);
        if (cached) return JSON.parse(cached);
    } catch {}

    const member = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId, workspaceId } },
        include: { workspace: true }
    });

    let result;
    if (member) {
        const workspace = member.workspace;
        const isOwner = workspace.ownerId === userId;
        const activeRole = member.customRole || member.role || "MEMBER";
        result = { role: isOwner ? "OWNER" : activeRole, isOwner, workspace, member };
    } else {
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId }
        });

        if (!workspace) {
            result = { role: null, isOwner: false, workspace: null, member: null };
        } else {
            const isOwner = workspace.ownerId === userId;
            result = isOwner 
                ? { role: "OWNER", isOwner: true, workspace, member: null }
                : { role: null, isOwner: false, workspace, member: null };
        }
    }

    try {
        await redisCache.set(cacheKey, JSON.stringify(result), 15); // Cache for 15 seconds
    } catch {}

    return result;
};

export const invalidateUserWorkspaceRoleCache = async (userId, workspaceId) => {
    if (!userId || !workspaceId) return;
    const cacheKey = `workspace:role:${userId}:${workspaceId}`;
    try {
        await redisCache.del(cacheKey);
    } catch {}
};

export const hasWorkspacePermission = async (userId, workspaceId, permissionKey) => {
    const { role, isOwner, workspace } = await getUserWorkspaceRole(userId, workspaceId);
    if (!workspace) return false;
    if (isOwner) return true;

    const settings = typeof workspace.settings === "object" && workspace.settings ? workspace.settings : {};
    const rolePermissions = settings.rolePermissions || defaultPermissions;
    
    const rolePerms = rolePermissions[role];
    if (rolePerms && typeof rolePerms === 'object') {
        if (rolePerms[permissionKey] !== undefined) {
            return !!rolePerms[permissionKey];
        }
    }

    const fallbackPerms = defaultPermissions[role] || defaultPermissions.MEMBER;
    return fallbackPerms[permissionKey] ?? false;
};

