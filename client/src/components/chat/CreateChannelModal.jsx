import { useState } from 'react';
import { X, Hash, Lock } from 'lucide-react';
import api from '@/configs/api';
import toast from 'react-hot-toast';

export default function CreateChannelModal({ isOpen, onClose, workspaceId, onChannelCreated }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
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
                workspaceId,
                isPrivate
            });

            toast.success("Channel created successfully!");
            if (onChannelCreated) onChannelCreated(data.channel);
            setName('');
            setDescription('');
            setIsPrivate(false);
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create channel");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl text-left">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                        {isPrivate ? <Lock className="size-4 text-amber-500" /> : <Hash className="size-4 text-indigo-500" />}
                        Create a Channel
                    </h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer">
                        <X className="size-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    <div>
                        <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Channel Name</label>
                        <input
                            type="text"
                            placeholder="e.g. general, announcements, dev-team"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 text-zinc-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Description (Optional)</label>
                        <textarea
                            placeholder="What is this channel about?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 text-zinc-900 dark:text-white focus:outline-hidden focus:border-indigo-500 resize-none"
                        />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
                        <div>
                            <p className="font-bold text-zinc-900 dark:text-white">Make Private</p>
                            <p className="text-[11px] text-zinc-500">Only invited members can view this channel</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={isPrivate}
                            onChange={(e) => setIsPrivate(e.target.checked)}
                            className="size-4 text-indigo-600 rounded cursor-pointer"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium cursor-pointer">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading || !name.trim()} className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-50 transition cursor-pointer">
                            {loading ? "Creating..." : "Create Channel"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
