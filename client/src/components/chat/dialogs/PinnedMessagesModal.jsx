import { useState, useEffect } from 'react';
import { X, Pin, MessageSquare } from 'lucide-react';
import api from '@/configs/api';

export default function PinnedMessagesModal({ isOpen, onClose, channelId }) {
    const [pinnedMessages, setPinnedMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !channelId) return;
        setLoading(true);
        api.get(`/api/chat/channels/${channelId}/pinned`)
            .then(({ data }) => setPinnedMessages(data.messages || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [isOpen, channelId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl text-left text-xs animate-stiff-pop">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                        <Pin className="size-4 text-amber-500 fill-amber-500" /> Pinned Messages
                    </h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer">
                        <X className="size-5" />
                    </button>
                </div>

                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                    {loading ? (
                        <p className="text-xs text-zinc-400 text-center py-8">Loading pinned items...</p>
                    ) : pinnedMessages.length === 0 ? (
                        <div className="text-center py-8 text-zinc-400 space-y-1">
                            <Pin className="size-8 mx-auto opacity-40" />
                            <p className="font-semibold text-zinc-700 dark:text-zinc-300">No pinned messages</p>
                            <p className="text-[11px]">Pin important links, announcements, or messages to access them easily.</p>
                        </div>
                    ) : (
                        pinnedMessages.map((msg) => (
                            <div key={msg.id} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{msg.user?.name || 'User'}</span>
                                    <span className="text-[10px] text-zinc-400">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
