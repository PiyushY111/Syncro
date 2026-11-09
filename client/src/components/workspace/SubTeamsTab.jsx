import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Users, Plus, Trash2, Folder, UserPlus, UserMinus, ChevronRight, Edit3 } from 'lucide-react';
import api from '@/configs/api';
import toast from 'react-hot-toast';
import { canManageSubTeams } from '@/utils/permissions';

export default function SubTeamsTab({ currentWorkspace, currentUserRole }) {
    const [subTeams, setSubTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [activeSubTeam, setActiveSubTeam] = useState(null);
    const [addingMemberId, setAddingMemberId] = useState('');

    const canManage = canManageSubTeams(currentUserRole, currentWorkspace);

    // Read via a ref inside fetchSubTeams so the callback's identity only
    // depends on the workspace (matching the original effect's trigger),
    // without reading a stale activeSubTeam from a captured closure.
    const activeSubTeamRef = useRef(activeSubTeam);
    useEffect(() => {
        activeSubTeamRef.current = activeSubTeam;
    }, [activeSubTeam]);

    const fetchSubTeams = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/api/subteams/workspace/${currentWorkspace.id}`);
            setSubTeams(data.subTeams || []);
            const current = activeSubTeamRef.current;
            if (current) {
                const updatedActive = data.subTeams.find(s => s.id === current.id);
                setActiveSubTeam(updatedActive || null);
            }
        } catch (error) {
            console.error("Error fetching sub-teams:", error);
            toast.error("Failed to load sub-teams");
        } finally {
            setLoading(false);
        }
    }, [currentWorkspace?.id]);

    useEffect(() => {
        if (currentWorkspace?.id) {
            fetchSubTeams();
        }
    }, [currentWorkspace?.id, fetchSubTeams]);

    const handleCreateSubTeam = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        try {
            await api.post('/api/subteams', {
                name: name.trim(),
                description: description.trim(),
                workspaceId: currentWorkspace.id
            });
            toast.success("Sub-team created successfully");
            setName('');
            setDescription('');
            setIsCreateOpen(false);
            fetchSubTeams();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create sub-team");
        }
    };

    const handleDeleteSubTeam = async (id, teamName) => {
        if (!window.confirm(`Are you sure you want to permanently delete "${teamName}"?`)) return;

        try {
            await api.delete(`/api/subteams/${id}`);
            toast.success("Sub-team deleted successfully");
            if (activeSubTeam?.id === id) {
                setActiveSubTeam(null);
            }
            fetchSubTeams();
        } catch {
            toast.error("Failed to delete sub-team");
        }
    };

    const handleProjectAssign = async (subTeamId, projectId) => {
        try {
            await api.put(`/api/subteams/${subTeamId}`, { projectId: projectId || null });
            toast.success("Project assignment updated");
            fetchSubTeams();
        } catch {
            toast.error("Failed to assign project");
        }
    };

    const handleAddMember = async (subTeamId) => {
        if (!addingMemberId) return;

        try {
            await api.post(`/api/subteams/${subTeamId}/members`, { userId: addingMemberId });
            toast.success("Member added to sub-team");
            setAddingMemberId('');
            fetchSubTeams();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add member");
        }
    };

    const handleRemoveMember = async (subTeamId, userId) => {
        if (!window.confirm("Remove this member from the sub-team?")) return;

        try {
            await api.delete(`/api/subteams/${subTeamId}/members/${userId}`);
            toast.success("Member removed from sub-team");
            fetchSubTeams();
        } catch {
            toast.error("Failed to remove member");
        }
    };

    // Filter workspace members who are NOT already in the active sub-team
    const availableMembers = currentWorkspace?.members?.filter(member => 
        !activeSubTeam?.members?.some(sm => sm.userId === member.userId)
    ) || [];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
            {/* Sub-Teams Sidebar list */}
            <div className="lg:col-span-1 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">Sub-Teams</h2>
                    {canManage && (
                        <button onClick={() => setIsCreateOpen(!isCreateOpen)} className="p-1 rounded bg-brand-tint dark:bg-brand/15 text-brand dark:text-violet-300 hover:opacity-80 transition cursor-pointer">
                            <Plus className="size-4" />
                        </button>
                    )}
                </div>

                {isCreateOpen && (
                    <form onSubmit={handleCreateSubTeam} className="sx-glass p-4 rounded-2xl space-y-3 animate-stiff-pop">
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1">Sub-Team Name</label>
                            <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Frontend Engineers" className="w-full text-sm rounded-xl border border-slate-900/10 dark:border-white/[0.07] px-3 py-1.5 focus:outline-none focus:border-brand bg-white/70 dark:bg-white/[0.04] text-zinc-900 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1">Description (Optional)</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this sub-team work on?" className="w-full text-sm rounded-xl border border-slate-900/10 dark:border-white/[0.07] px-3 py-1.5 focus:outline-none focus:border-brand bg-white/70 dark:bg-white/[0.04] text-zinc-900 dark:text-white h-16 resize-none" />
                        </div>
                        <div className="flex justify-end gap-2 text-xs pt-1">
                            <button type="button" onClick={() => setIsCreateOpen(false)} className="px-3 py-1.5 rounded border border-slate-900/10 text-zinc-600 hover:bg-slate-500/[0.06] cursor-pointer">Cancel</button>
                            <button type="submit" className="px-3 py-1.5 rounded bg-brand text-white hover:opacity-90 cursor-pointer font-medium">Create</button>
                        </div>
                    </form>
                )}

                {loading ? (
                    <p className="text-sm text-zinc-500">Loading sub-teams...</p>
                ) : subTeams.length === 0 ? (
                    <div className="bg-slate-500/[0.05] dark:bg-white/[0.03] border border-dashed border-slate-900/[0.07] dark:border-white/[0.07] rounded-xl p-6 text-center">
                        <Users className="size-8 mx-auto text-zinc-400 mb-2" />
                        <p className="text-xs text-zinc-500">No sub-teams created yet</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {subTeams.map(team => (
                            <div key={team.id} onClick={() => setActiveSubTeam(team)} className={`p-4 rounded-xl border cursor-pointer transition-stiff flex items-center justify-between ${
                                activeSubTeam?.id === team.id 
                                    ? 'bg-blue-50/80 dark:bg-brand/15 border-blue-500/50' 
                                    : 'bg-white dark:bg-white/[0.03] border-slate-900/[0.07] dark:border-white/[0.07] hover:border-zinc-300'
                            }`}>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{team.name}</h3>
                                    <p className="text-xs text-zinc-500 truncate mt-0.5">{team.members?.length || 0} members</p>
                                    {team.project && (
                                        <div className="flex items-center gap-1 mt-1 text-[11px] text-brand dark:text-violet-300 font-medium">
                                            <Folder className="size-3" />
                                            <span className="truncate">{team.project.name}</span>
                                        </div>
                                    )}
                                </div>
                                <ChevronRight className="size-4 text-zinc-400 shrink-0 ml-2" />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Active Sub-Team Detail View */}
            <div className="lg:col-span-2">
                {activeSubTeam ? (
                    <div className="sx-glass rounded-2xl p-6 space-y-6 min-h-[400px] animate-stiff-pop">
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{activeSubTeam.name}</h2>
                                <p className="text-sm text-zinc-500 mt-1">{activeSubTeam.description || "No description provided."}</p>
                            </div>
                            {canManage && (
                                <button onClick={() => handleDeleteSubTeam(activeSubTeam.id, activeSubTeam.name)} className="p-2 rounded text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer" title="Delete Sub-Team">
                                    <Trash2 className="size-4" />
                                </button>
                            )}
                        </div>

                        <hr className="border-slate-900/[0.07] dark:border-white/[0.07]" />

                        {/* Project Assignment Section */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Assigned Project</h4>
                            {canManage ? (
                                <div className="flex items-center gap-2 max-w-md">
                                    <select value={activeSubTeam.projectId || ''} onChange={e => handleProjectAssign(activeSubTeam.id, e.target.value)} className="w-full text-sm rounded-xl border border-slate-900/10 dark:border-white/[0.07] px-3 py-1.5 focus:outline-none focus:border-brand bg-white/70 dark:bg-white/[0.04] text-zinc-900 dark:text-white">
                                        <option value="">No Project Assigned (Public Access)</option>
                                        {currentWorkspace?.projects?.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                                    {activeSubTeam.project ? activeSubTeam.project.name : "No project assigned"}
                                </p>
                            )}
                            <p className="text-[11px] text-zinc-400">
                                Assigning this sub-team to a project grants all sub-team members access to the project and its tasks.
                            </p>
                        </div>

                        <hr className="border-slate-900/[0.07] dark:border-white/[0.07]" />

                        {/* Sub-Team Members list */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Members ({activeSubTeam.members?.length || 0})</h4>
                            </div>

                            {/* Add member box */}
                            {canManage && availableMembers.length > 0 && (
                                <div className="flex items-center gap-2 max-w-md">
                                    <select value={addingMemberId} onChange={e => setAddingMemberId(e.target.value)} className="w-full text-sm rounded-xl border border-slate-900/10 dark:border-white/[0.07] px-3 py-1.5 focus:outline-none focus:border-brand bg-white/70 dark:bg-white/[0.04] text-zinc-900 dark:text-white">
                                        <option value="">Select workspace member...</option>
                                        {availableMembers.map(m => (
                                            <option key={m.userId} value={m.userId}>{m.user?.name} ({m.user?.email})</option>
                                        ))}
                                    </select>
                                    <button onClick={() => handleAddMember(activeSubTeam.id)} className="flex items-center justify-center p-2 rounded bg-brand hover:bg-brand-strong text-white cursor-pointer transition shrink-0" title="Add Member">
                                        <UserPlus className="size-4" />
                                    </button>
                                </div>
                            )}

                            {activeSubTeam.members?.length === 0 ? (
                                <p className="text-xs text-zinc-500 py-2">No members in this sub-team yet.</p>
                            ) : (
                                <div className="divide-y divide-slate-900/[0.06] dark:divide-white/[0.06] border border-slate-900/[0.05] dark:border-white/[0.07] rounded-xl overflow-hidden">
                                    {activeSubTeam.members.map(member => (
                                        <div key={member.id} className="flex items-center justify-between p-3 hover:bg-slate-500/[0.06] dark:hover:bg-white/[0.04] transition">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-600 dark:text-zinc-300 uppercase overflow-hidden">
                                                    {member.user?.image ? (
                                                        <img src={member.user.image} alt={member.user?.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        member.user?.name?.slice(0, 2)
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-zinc-900 dark:text-white">{member.user?.name}</p>
                                                    <p className="text-[10px] text-zinc-500">{member.user?.email}</p>
                                                </div>
                                            </div>
                                            {canManage && (
                                                <button onClick={() => handleRemoveMember(activeSubTeam.id, member.userId)} className="p-1.5 rounded text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer" title="Remove Member">
                                                    <UserMinus className="size-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-500/[0.05] dark:bg-white/[0.03] border border-dashed border-slate-900/[0.07] dark:border-white/[0.07] rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                        <Users className="size-12 text-zinc-400 mb-3" />
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">No Sub-Team Selected</h3>
                        <p className="text-xs text-zinc-500 mt-1 max-w-sm">Select a sub-team from the sidebar to view members, project assignments, or modify configuration details.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
