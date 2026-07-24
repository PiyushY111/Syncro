export const ROLE_HIERARCHY = {
    OWNER: 4,
    ADMIN: 3,
    MANAGER: 2,
    MEMBER: 1
};

export const getUserWorkspaceRole = (workspace, userId) => {
    if (!workspace || !userId) return 'MEMBER';
    if (workspace.ownerId === userId) return 'OWNER';
    const member = workspace.members?.find(m => m.userId === userId || m.user?.id === userId);
    return member?.role || 'MEMBER';
};

export const canManageWorkspace = (role) => {
    return ['OWNER', 'ADMIN'].includes(role);
};

export const canDeleteWorkspace = (workspace, userId) => {
    return workspace?.ownerId === userId;
};

export const canManageMemberRoles = (currentUserRole) => {
    return ['OWNER', 'ADMIN'].includes(currentUserRole);
};

export const canInviteMembers = (currentUserRole) => {
    return ['OWNER', 'ADMIN', 'MANAGER'].includes(currentUserRole);
};

export const canRemoveMember = (currentUserRole, targetMemberRole, isSelf, workspace, targetUserId) => {
    if (workspace && workspace.ownerId === targetUserId) {
        return false; // Primary workspace owner cannot be removed
    }
    if (isSelf) return true; // Any member can leave workspace
    
    const userLevel = ROLE_HIERARCHY[currentUserRole] || 1;
    const targetLevel = ROLE_HIERARCHY[targetMemberRole] || 1;
    
    if (currentUserRole === 'OWNER') return true;
    if (currentUserRole === 'ADMIN') return targetLevel < 3; // ADMIN can remove MANAGER (2) and MEMBER (1)
    if (currentUserRole === 'MANAGER') return targetLevel < 2; // MANAGER can remove MEMBER (1)
    return false;
};

export const canCreateProject = (role) => {
    return ['OWNER', 'ADMIN', 'MANAGER'].includes(role);
};

export const canEditProject = (role, project, userId) => {
    if (['OWNER', 'ADMIN', 'MANAGER'].includes(role)) return true;
    if (project && project.team_lead === userId) return true;
    return false;
};

export const canDeleteProject = (role, project, userId) => {
    if (['OWNER', 'ADMIN'].includes(role)) return true;
    if (project && project.team_lead === userId) return true;
    return false;
};

export const canManageProjectStages = (role, project, userId) => {
    if (['OWNER', 'ADMIN', 'MANAGER'].includes(role)) return true;
    if (project && project.team_lead === userId) return true;
    return false;
};

export const canManageProjectMembers = (role, project, userId) => {
    if (['OWNER', 'ADMIN', 'MANAGER'].includes(role)) return true;
    if (project && project.team_lead === userId) return true;
    return false;
};

export const isProjectMember = (project, userId) => {
    if (!project || !userId) return false;
    if (project.team_lead === userId) return true;
    return project.members?.some(m => m.userId === userId || m.user?.id === userId);
};

export const canCreateTask = (role, project, userId) => {
    if (['OWNER', 'ADMIN', 'MANAGER'].includes(role)) return true;
    return isProjectMember(project, userId);
};

export const canEditTask = (role, project, task, userId) => {
    if (['OWNER', 'ADMIN', 'MANAGER'].includes(role)) return true;
    if (project && project.team_lead === userId) return true;
    if (task && task.assigneeId === userId) return true;
    return isProjectMember(project, userId);
};

export const canUpdateTaskStatus = (role, project, task, userId) => {
    return canEditTask(role, project, task, userId);
};

export const canDeleteTask = (role, project, task, userId) => {
    if (['OWNER', 'ADMIN', 'MANAGER'].includes(role)) return true;
    if (project && project.team_lead === userId) return true;
    if (task && task.assigneeId === userId) return true;
    return false;
};

export const canManageChannel = (role, channel, userId) => {
    if (['OWNER', 'ADMIN'].includes(role)) return true;
    if (channel && channel.creatorId === userId) return true;
    return false;
};
