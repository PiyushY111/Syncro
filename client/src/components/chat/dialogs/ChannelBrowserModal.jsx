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
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl text-left animate-stiff-pop">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
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
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                    />
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 pr-1">
                    {loading ? (
                        <p className="text-xs text-zinc-400 text-center py-8">Searching channels...</p>
                    ) : channels.length === 0 ? (
                        <p className="text-xs text-zinc-400 text-center py-8">No public channels found</p>
                    ) : (
                        channels.map((ch) => (
                            <div key={ch.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                                <div>
                                    <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100">
                                        <Hash className="size-3.5 text-indigo-500" />
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
                                    <button onClick={() => handleJoin(ch.id)} className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-1 transition cursor-pointer">
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
