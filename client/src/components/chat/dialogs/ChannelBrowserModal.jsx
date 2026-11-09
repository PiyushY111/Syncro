import { useState, useEffect } from 'react';
import { X, Search, Hash, UserCheck, UserPlus } from 'lucide-react';
import api from '@/configs/api';
import toast from 'react-hot-toast';

export default function ChannelBrowserModal({ isOpen, onClose, workspaceId, onChannelJoined }) {
    const [channels, setChannels] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !workspaceId) return;
        setLoading(true);
        api.get(`/api/chat/workspaces/${workspaceId}/browse?search=${encodeURIComponent(search)}`)
            .then(({ data }) => setChannels(data.channels || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [isOpen, workspaceId, search]);

    if (!isOpen) return null;

    const handleJoin = async (channelId) => {
        try {
            const { data } = await api.post(`/api/chat/channels/${channelId}/join`);
            toast.success(data.message || "Joined channel!");
            if (onChannelJoined) onChannelJoined(data.channel);
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to join channel");
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#14161f] border border-slate-900/[0.07] dark:border-white/[0.07] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl text-left animate-stiff-pop">
                <div className="flex items-center justify-between border-b border-slate-900/[0.05] dark:border-white/[0.07] pb-3">
                    <div>
                        <h3 className="font-bold text-base text-zinc-900 dark:text-white">Channel Browser</h3>
                        <p className="text-xs text-zinc-500">Discover and join public channels in your workspace</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer">
                        <X className="size-5" />
                    </button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search channels by name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-500/[0.05] dark:bg-white/[0.06] border border-slate-900/[0.07] dark:border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-900 dark:text-white focus:outline-hidden focus:border-brand"
                    />
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-900/[0.06] dark:divide-white/[0.06] pr-1">
                    {loading ? (
                        <p className="text-xs text-zinc-400 text-center py-8">Searching channels...</p>
                    ) : channels.length === 0 ? (
                        <p className="text-xs text-zinc-400 text-center py-8">No public channels found</p>
                    ) : (
                        channels.map((ch) => (
                            <div key={ch.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                                <div>
                                    <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100">
                                        <Hash className="size-3.5 text-brand dark:text-violet-300" />
                                        {ch.name}
                                    </div>
                                    {ch.description && <p className="text-[11px] text-zinc-500 truncate max-w-xs">{ch.description}</p>}
                                    <span className="text-[10px] text-zinc-400">{ch._count?.members || 0} members</span>
                                </div>

                                {ch.isJoined ? (
                                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold text-[11px] flex items-center gap-1">
                                        <UserCheck className="size-3" /> Joined
                                    </span>
                                ) : (
                                    <button onClick={() => handleJoin(ch.id)} className="px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-strong text-white font-medium flex items-center gap-1 transition cursor-pointer">
                                        <UserPlus className="size-3.5" /> Join Channel
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
