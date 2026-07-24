import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import api from '@/configs/api';

export default function ChannelStarredTab({ channelId }) {
    const [starredMessages, setStarredMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!channelId) return;
        setLoading(true);
        api.get(`/api/chat/channels/${channelId}/starred`)
            .then(({ data }) => setStarredMessages(data.messages || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [channelId]);

    return (
        <div className="space-y-4 text-sm">
            <h4 className="font-semibold text-[11px] text-zinc-400 uppercase tracking-wider">Starred Messages ({starredMessages.length})</h4>

            {loading ? (
                <p className="text-sm text-zinc-400 text-center py-8">Loading starred messages...</p>
            ) : starredMessages.length === 0 ? (
                <div className="text-center py-16 text-zinc-400 space-y-3">
                    <Star className="size-10 mx-auto text-zinc-200" />
                    <p className="font-semibold text-zinc-600">No starred messages</p>
                    <p className="text-xs text-zinc-400 max-w-xs mx-auto">Star any message in the channel to bookmark it here for quick access.</p>
                </div>
            ) : (
                <div className="space-y-0">
                    {starredMessages.map((msg) => (
                        <div key={msg.id} className="px-3 py-3 border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                            <div className="flex items-baseline justify-between mb-1">
                                <span className="font-semibold text-sm text-zinc-900">{msg.user?.name || 'User'}</span>
                                <span className="text-xs text-zinc-400">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-sm text-zinc-600 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
