import { useEffect, useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import InviteMemberDialog from '@/components/workspace/InviteMemberDialog';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '@/context/AuthContext';
import { updateWorkspace } from '@/features/workspaceSlice';
import api from '@/configs/api';
import toast from 'react-hot-toast';
import TeamStats from '@/components/workspace/TeamStats';
import TeamMemberList from '@/components/workspace/TeamMemberList';

import { getUserWorkspaceRole, canManageMemberRoles, canInviteMembers } from '@/utils/permissions';

export default function Team() {
    const dispatch = useDispatch();
    const { user: currentUser } = useAuth();

    const [tasks, setTasks] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [users, setUsers] = useState([]);
    
    const currentWorkspace = useSelector((state) => state?.workspace?.currentWorkspace || null);
    const projects = currentWorkspace?.projects || [];

    const currentUserRole = getUserWorkspaceRole(currentWorkspace, currentUser?.id);
    const canInvite = canInviteMembers(currentUserRole);

    const roleHierarchy = { OWNER: 4, ADMIN: 3, MANAGER: 2, MEMBER: 1 };

    const canEditMember = (targetMember) => {
        if (currentWorkspace?.ownerId === targetMember.userId) return false;
        if (targetMember.userId === currentUser?.id) return false;
        if (!canManageMemberRoles(currentUserRole)) return false;
        
        const targetRoleLevel = roleHierarchy[targetMember.role] || 1;
        const currentUserRoleLevel = roleHierarchy[currentUserRole] || 1;
        return currentUserRoleLevel > targetRoleLevel;
    };

    const handleRoleChange = async (memberId, newRole) => {
        try {
            const { data } = await api.put(`/api/workspaces/${currentWorkspace.id}/members/${memberId}`, { role: newRole });
            dispatch(updateWorkspace(data.workspace));
            toast.success("Member role updated successfully");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update role");
        }
    };

    const handleRemoveMember = async (memberId, memberName, isSelf = false) => {
        const confirmMsg = isSelf 
            ? "Are you sure you want to leave this workspace?" 
            : `Are you sure you want to remove ${memberName} from this workspace?`;
            
        if (!window.confirm(confirmMsg)) return;

        try {
            const { data } = await api.delete(`/api/workspaces/${currentWorkspace.id}/members/${memberId}`);
            dispatch(updateWorkspace(data.workspace));
            toast.success(isSelf ? "You have left the workspace" : "Member removed successfully");
            if (isSelf) {
                window.location.reload();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to remove member");
        }
    };

    const filteredUsers = users.filter(
        (user) =>
            user?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user?.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        setUsers(currentWorkspace?.members || []);
        setTasks(currentWorkspace?.projects?.reduce((acc, proj) => [...acc, ...proj.tasks], []) || []);
    }, [currentWorkspace]);

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 text-left">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-1">Team</h1>
                    <p className="text-gray-500 dark:text-zinc-400 text-sm">
                        Manage team members and their contributions
                    </p>
                </div>
                {canInvite && (
                    <button onClick={() => setIsDialogOpen(true)} className="flex items-center px-5 py-2 rounded text-sm bg-gradient-to-br from-blue-500 to-blue-600 hover:opacity-90 text-white transition cursor-pointer font-medium" >
                        <UserPlus className="w-4 h-4 mr-2" /> Invite Member
                    </button>
                )}
                <InviteMemberDialog isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
            </div>

            {/* Stats Cards */}
            <TeamStats
                membersCount={users.length}
                projects={projects}
                tasksCount={tasks.length}
            />

            {/* Search */}
            <div className="relative max-w-md text-left">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-zinc-400 size-3.5" />
                <input placeholder="Search team members..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-full text-sm rounded-md border border-gray-300 dark:border-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-400 py-2 focus:outline-none focus:border-blue-500 bg-white dark:bg-zinc-950" />
            </div>

            {/* Team Members List */}
            <TeamMemberList
                filteredUsers={filteredUsers}
                users={users}
                canEditMember={canEditMember}
                handleRoleChange={handleRoleChange}
                handleRemoveMember={handleRemoveMember}
                currentUser={currentUser}
                currentWorkspace={currentWorkspace}
            />
        </div>
    );
}
