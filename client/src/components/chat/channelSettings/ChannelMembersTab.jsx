import { useState } from 'react';
import { ShieldCheck, ShieldAlert, UserMinus, UserPlus, MessageSquare } from 'lucide-react';
import api from '@/configs/api';
import toast from 'react-hot-toast';

export default function ChannelMembersTab({ channel, workspaceMembers = [], onChannelUpdated, onSelectDM }) {
    const [selectedUserId, setSelectedUserId] = useState('');
    const [adminIds, setAdminIds] = useState([channel?.creatorId].filter(Boolean));

    const handleAddMember = async () => {
        if (!selectedUserId) return;
        try {
            const { data } = await api.post(`/api/chat/channels/${channel.id}/members`, { memberUserId: selectedUserId });
            toast.success("Member added to channel!");
            if (onChannelUpdated) onChannelUpdated(data.channel);
            setSelectedUserId('');
        } catch { toast.error("Failed to add member"); }
    };

    const handleRemoveMember = async (memberUserId) => {
        try {
            const { data } = await api.delete(`/api/chat/channels/${channel.id}/members/${memberUserId}`);
            toast.success("Member removed from channel");
            if (onChannelUpdated) onChannelUpdated(data.channel);
        } catch { toast.error("Failed to remove member"); }
    };

    const toggleAdminRole = (userId) => {
        if (adminIds.includes(userId)) {
            setAdminIds(prev => prev.filter(id => id !== userId));
            toast.success("Admin role removed");
        } else {
            setAdminIds(prev => [...prev, userId]);
            toast.success("Promoted to Group Admin");
        }
    };

    const nonMembers = workspaceMembers.filter(m => !channel.members?.some(cm => cm.id === m.userId || cm.id === m.user?.id));

    return (
        <div className="space-y-4 text-sm">
            <h4 className="font-semibold text-[11px] text-zinc-400 uppercase tracking-wider">Channel Members ({channel.members?.length || 0})</h4>

            {nonMembers.length > 0 && (
                <div className="flex gap-2 bg-zinc-50 border border-zinc-200 p-3 rounded-lg">
                    <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="flex-1 bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:border-blue-400 transition">
                        <option value="">Select workspace member to add...</option>
                        {nonMembers.map(m => (<option key={m.id} value={m.user?.id || m.userId}>{m.user?.name || "Member"}</option>))}
                    </select>
                    <button onClick={handleAddMember} disabled={!selectedUserId} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg disabled:opacity-40 flex items-center gap-1.5 cursor-pointer transition text-sm">
                        <UserPlus className="size-4" /> Add
                    </button>
                </div>
            )}

            <div className="max-h-80 overflow-y-auto space-y-0.5">
                {channel.members?.map((m) => {
                    const isAdmin = adminIds.includes(m.id);
                    return (
                        <div key={m.id} className="group flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-zinc-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                    {m.name ? m.name[0].toUpperCase() : 'U'}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm text-zinc-900">{m.name}</span>
                                        {isAdmin && <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-600 font-semibold">Group Admin</span>}
                                    </div>
                                    <span className="text-xs text-zinc-400">{m.email}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => toggleAdminRole(m.id)} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 cursor-pointer transition" title={isAdmin ? "Remove Admin" : "Make Admin"}>
                                    {isAdmin ? <ShieldAlert className="size-4 text-amber-500" /> : <ShieldCheck className="size-4 text-emerald-500" />}
                                </button>
                                <button onClick={() => onSelectDM && onSelectDM(m)} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 cursor-pointer transition" title="Message Privately">
                                    <MessageSquare className="size-4 text-blue-500" />
                                </button>
                                <button onClick={() => handleRemoveMember(m.id)} className="p-1.5 rounded-lg hover:bg-zinc-100 text-rose-400 cursor-pointer transition" title="Remove from Group">
                                    <UserMinus className="size-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
