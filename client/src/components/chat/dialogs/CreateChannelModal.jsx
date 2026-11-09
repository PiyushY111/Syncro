import { useState } from 'react';
import { X, Hash, Lock, Image } from 'lucide-react';
import api from '@/configs/api';
import toast from 'react-hot-toast';

export default function CreateChannelModal({ isOpen, onClose, workspaceId, onChannelCreated }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [iconUrl, setIconUrl] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        try {
            setLoading(true);
            const { data } = await api.post('/api/chat/channels', {
                name: name.trim(),
                description: description.trim(),
                iconUrl: iconUrl.trim() || null,
                workspaceId,
                isPrivate
            });

            toast.success("Channel created successfully!");
            if (onChannelCreated) onChannelCreated(data.channel);
            setName('');
            setDescription('');
            setIconUrl('');
            setIsPrivate(false);
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create channel");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#14161f] border border-slate-900/[0.07] dark:border-white/[0.07] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl text-left animate-stiff-pop">
                <div className="flex items-center justify-between border-b border-slate-900/[0.05] dark:border-white/[0.07] pb-3">
                    <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                        {isPrivate ? <Lock className="size-4 text-amber-500" /> : <Hash className="size-4 text-brand dark:text-violet-300" />}
                        Create a Channel
                    </h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer">
                        <X className="size-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                    <div>
                        <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Channel Name</label>
                        <input
                            type="text"
                            placeholder="e.g. general, announcements, dev-team"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full bg-slate-500/[0.05] dark:bg-white/[0.06] border rounded-lg p-2 text-zinc-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Channel Icon Image URL (Optional)</label>
                        <input
                            type="url"
                            placeholder="https://example.com/channel-icon.png"
                            value={iconUrl}
                            onChange={(e) => setIconUrl(e.target.value)}
                            className="w-full bg-slate-500/[0.05] dark:bg-white/[0.06] border rounded-lg p-2 text-zinc-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Description (Optional)</label>
                        <textarea
                            placeholder="What is this channel about?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="w-full bg-slate-500/[0.05] dark:bg-white/[0.06] border rounded-lg p-2 text-zinc-900 dark:text-white resize-none"
                        />
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-500/[0.05] dark:bg-white/[0.06] border">
                        <div>
                            <p className="font-bold text-zinc-900 dark:text-white">Make Private</p>
                            <p className="text-[11px] text-zinc-500">Only invited members can view this channel</p>
                        </div>
                        <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="size-4 text-brand rounded cursor-pointer" />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-500/[0.08] dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300 font-medium">Cancel</button>
                        <button type="submit" disabled={loading || !name.trim()} className="px-5 py-2 rounded-lg bg-brand hover:bg-brand-strong text-white font-medium disabled:opacity-50">
                            {loading ? "Creating..." : "Create Channel"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
