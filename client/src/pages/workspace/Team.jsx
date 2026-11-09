import { useEffect, useState } from 'react';
import { Search, UserPlus, UsersRound } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
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
    const [confirmState, setConfirmState] = useState({ isOpen: false, memberId: null, memberName: '', oldRole: '', newRole: '' });
    
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

    const handleRoleChange = (memberId, newRole) => {
        const member = users.find(m => m.id === memberId);
        const name = member?.user?.name || "this user";
        const oldRole = member?.customRole || member?.role || "MEMBER";
        if (newRole === oldRole) return;

        setConfirmState({
            isOpen: true,
            memberId,
            memberName: name,
            oldRole,
            newRole
        });
    };

    const executeRoleChange = async () => {
        const { memberId, newRole } = confirmState;
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        try {
            const { data } = await api.put(`/api/workspaces/${currentWorkspace.id}/members/${memberId}`, { role: newRole });
            dispatch(updateWorkspace(data.workspace));
            toast.success("Member role updated successfully");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update role");
            setUsers([...users]);
        }
    };

    const cancelRoleChange = () => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        setUsers([...users]);
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
        <div className="space-y-8 max-w-6xl mx-auto pb-12">
            <PageHeader
                icon={UsersRound}
                tone="sky"
                eyebrow={`${users.length} member${users.length === 1 ? '' : 's'}`}
                title="Team"
                description="Everyone in this workspace, their roles and what they're working on."
                actions={canInvite && (
                    <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                        <UserPlus className="h-4 w-4" /> Invite member
                    </Button>
                )}
            />
            <InviteMemberDialog isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />

            <TeamStats membersCount={users.length} projects={projects} tasksCount={tasks.length} />

            {/* Tabs Selector */}
            <div className="flex border-b border-slate-900/[0.07] dark:border-white/[0.07] text-left">
                <button
                    onClick={() => setActiveTab("members")}
                    className={`pb-2.5 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                        activeTab === "members"
                            ? "border-brand dark:border-lime text-brand dark:text-violet-300"
                            : "border-transparent text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                    }`}
                >
                    Workspace Members
                </button>
                <button
                    onClick={() => setActiveTab("subteams")}
                    className={`pb-2.5 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                        activeTab === "subteams"
                            ? "border-brand dark:border-lime text-brand dark:text-violet-300"
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
                        <input placeholder="Search team members..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-full text-sm rounded-xl border border-slate-900/10 dark:border-white/[0.07] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-400 py-2 focus:outline-none focus:border-brand bg-white/70 dark:bg-white/[0.04]" />
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

            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={cancelRoleChange}
                onConfirm={executeRoleChange}
                memberName={confirmState.memberName}
                oldRole={confirmState.oldRole}
                newRole={confirmState.newRole}
            />
        </div>
    );
}

function ConfirmModal({ isOpen, onClose, onConfirm, memberName, oldRole, newRole }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
            <div className="bg-white dark:bg-[#14161f] border border-slate-900/[0.07] dark:border-white/[0.07] rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col space-y-4 text-left">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">Confirm Role Change</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Are you sure you want to change the role of <strong>{memberName}</strong> from <strong>{oldRole}</strong> to <strong>{newRole}</strong>?
                </p>
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-900/[0.07] dark:border-white/[0.07] text-zinc-700 dark:text-zinc-300 hover:bg-slate-500/[0.06] dark:hover:bg-white/[0.07] transition cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-brand hover:bg-brand-strong text-white shadow-md hover:shadow-lg transition cursor-pointer"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}
