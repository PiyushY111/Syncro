export const ROLE_HIERARCHY = { OWNER: 4, ADMIN: 3, MANAGER: 2, MEMBER: 1 };

export const getUserWorkspaceRole = (workspace, userId) => {
    if (!workspace || !userId) return 'MEMBER';
    if (workspace.ownerId === userId) return 'OWNER';
    const member = workspace.members?.find(m => m.userId === userId || m.user?.id === userId);
    return member?.customRole || member?.role || 'MEMBER';
};

const checkPerm = (role, ws, key, def) => {
    if (role === 'OWNER') return true;
    if (ws?.settings?.rolePermissions?.[role]) {
        return ws.settings.rolePermissions[role][key] ?? false;
    }
    return def.includes(role);
};

export const canManageWorkspace = (role) => ['OWNER', 'ADMIN'].includes(role);
export const canDeleteWorkspace = (workspace, userId) => workspace?.ownerId === userId;
export const canManageMemberRoles = (role) => ['OWNER', 'ADMIN'].includes(role);
export const canInviteMembers = (role, ws) => checkPerm(role, ws, 'manageMembers', ['OWNER', 'ADMIN', 'MANAGER']);
export const canRemoveMember = (role, targetRole, isSelf, ws, targetUserId) => {
    if (ws && ws.ownerId === targetUserId) return false;
    if (isSelf) return true;
    const targetLevel = ROLE_HIERARCHY[targetRole] || 1;
    if (role === 'OWNER') return true;
    if (role === 'ADMIN') return targetLevel < 3;
    if (role === 'MANAGER') return targetLevel < 2;
    return false;
};

export const canCreateProject = (role, ws) => checkPerm(role, ws, 'createProject', ['OWNER', 'ADMIN', 'MANAGER']);
export const canEditProject = (role, project, userId, ws) => 
    role === 'OWNER' || (project?.team_lead === userId) || checkPerm(role, ws, 'editProject', ['OWNER', 'ADMIN', 'MANAGER']);
export const canDeleteProject = (role, project, userId, ws) => 
    role === 'OWNER' || (project?.team_lead === userId) || checkPerm(role, ws, 'deleteProject', ['OWNER', 'ADMIN']);
export const canManageProjectStages = (role, project, userId, ws) => 
    role === 'OWNER' || (project?.team_lead === userId) || checkPerm(role, ws, 'editProject', ['OWNER', 'ADMIN', 'MANAGER']);
export const canManageProjectMembers = (role, project, userId, ws) => 
    role === 'OWNER' || (project?.team_lead === userId) || checkPerm(role, ws, 'editProject', ['OWNER', 'ADMIN', 'MANAGER']);

export const isProjectMember = (project, userId) => 
    !!project && !!userId && (project.team_lead === userId || project.members?.some(m => m.userId === userId || m.user?.id === userId));

export const canCreateTask = (role, project, userId, ws) => 
    role === 'OWNER' || (isProjectMember(project, userId) && checkPerm(role, ws, 'createTasks', ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER'])) || checkPerm(role, ws, 'createTasks', ['OWNER', 'ADMIN', 'MANAGER']);

export const canEditTask = (role, project, task, userId, ws) => 
    role === 'OWNER' || project?.team_lead === userId || task?.assigneeId === userId || (isProjectMember(project, userId) && checkPerm(role, ws, 'editTasks', ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER'])) || checkPerm(role, ws, 'editTasks', ['OWNER', 'ADMIN', 'MANAGER']);

export const canUpdateTaskStatus = (role, project, task, userId, ws) => canEditTask(role, project, task, userId, ws);
export const canDeleteTask = (role, project, task, userId, ws) => 
    role === 'OWNER' || project?.team_lead === userId || task?.assigneeId === userId || checkPerm(role, ws, 'deleteTasks', ['OWNER', 'ADMIN', 'MANAGER']);

export const canManageChannel = (role, channel, userId, ws) => 
    role === 'OWNER' || channel?.creatorId === userId || checkPerm(role, ws, 'manageChannels', ['OWNER', 'ADMIN']);

export const canManageWhiteboards = (role, ws) => checkPerm(role, ws, 'manageWhiteboards', ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER']);
export const canManageChannels = (role, ws) => checkPerm(role, ws, 'manageChannels', ['OWNER', 'ADMIN', 'MANAGER']);
export const canManageSubTeams = (role, ws) => checkPerm(role, ws, 'manageSubTeams', ['OWNER', 'ADMIN', 'MANAGER']);
