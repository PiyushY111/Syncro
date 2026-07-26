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
import SubTeamsTab from '@/components/workspace/SubTeamsTab';
import { getUserWorkspaceRole, canInviteMembers } from '@/utils/permissions';

export default function Team() {
    const dispatch = useDispatch();
    const { user: currentUser } = useAuth();

    const [tasks, setTasks] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("members");
    const [users, setUsers] = useState([]);
    
    const currentWorkspace = useSelector((state) => state?.workspace?.currentWorkspace || null);
    const projects = currentWorkspace?.projects || [];

    const currentUserRole = getUserWorkspaceRole(currentWorkspace, currentUser?.id);
    const canInvite = canInviteMembers(currentUserRole, currentWorkspace);

    const canEditMember = (targetMember) => {
        const isCallerOwner = currentWorkspace?.ownerId === currentUser?.id || currentUserRole === 'OWNER';
        const isTargetOwner = currentWorkspace?.ownerId === targetMember.userId || targetMember.role === 'OWNER';

        if (isCallerOwner) return true;
        if (isTargetOwner) return false;

        if (currentUserRole === 'ADMIN') {
            return targetMember.role !== 'ADMIN' && targetMember.role !== 'OWNER';
        }
        if (currentUserRole === 'MANAGER') {
            return targetMember.role !== 'ADMIN' && targetMember.role !== 'OWNER' && targetMember.role !== 'MANAGER';
        }
        return false;
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

            <TeamStats membersCount={users.length} projects={projects} tasksCount={tasks.length} />

            {/* Tabs Selector */}
            <div className="flex border-b border-gray-200 dark:border-zinc-800 text-left">
                <button
                    onClick={() => setActiveTab("members")}
                    className={`pb-2.5 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                        activeTab === "members"
                            ? "border-blue-600 text-blue-600 dark:text-blue-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                    }`}
                >
                    Workspace Members
                </button>
                <button
                    onClick={() => setActiveTab("subteams")}
                    className={`pb-2.5 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                        activeTab === "subteams"
                            ? "border-blue-600 text-blue-600 dark:text-blue-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                    }`}
                >
                    Sub-Teams (Project Teams)
                </button>
            </div>

            {activeTab === "members" ? (
                <>
                    <div className="relative max-w-md text-left">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-zinc-400 size-3.5" />
                        <input placeholder="Search team members..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-full text-sm rounded-md border border-gray-300 dark:border-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-400 py-2 focus:outline-none focus:border-blue-500 bg-white dark:bg-zinc-950" />
                    </div>

                    <TeamMemberList
                        filteredUsers={filteredUsers}
                        users={users}
                        canEditMember={canEditMember}
                        handleRoleChange={handleRoleChange}
                        handleRemoveMember={handleRemoveMember}
                        currentUser={currentUser}
                        currentWorkspace={currentWorkspace}
                        currentUserRole={currentUserRole}
                    />
                </>
            ) : (
                <SubTeamsTab
                    currentWorkspace={currentWorkspace}
                    currentUserRole={currentUserRole}
                />
            )}
        </div>
    );
}
