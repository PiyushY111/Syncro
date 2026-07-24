import { useState } from 'react';
import { X, CheckSquare } from 'lucide-react';
import api from '@/configs/api';
import toast from 'react-hot-toast';

export default function ConvertMessageModal({ isOpen, onClose, message, projects = [] }) {
    const [title, setTitle] = useState(message?.content?.slice(0, 50) || '');
    const [projectId, setProjectId] = useState(projects[0]?.id || '');
    const [priority, setPriority] = useState('MEDIUM');
    const [loading, setLoading] = useState(false);

    if (!isOpen || !message) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !projectId) return;

        try {
            setLoading(true);
            await api.post(`/api/projects/${projectId}/tasks`, {
                title: title.trim(),
                description: message.content,
                priority
            });
            toast.success("Converted chat message to Project Task!");
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create task");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 text-left text-xs animate-fade-in">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl animate-stiff-pop">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                        <CheckSquare className="size-4 text-blue-500" /> Convert Message to Task
                    </h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer">
                        <X className="size-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Task Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 text-zinc-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Target Project</label>
                        <select
                            value={projectId}
                            onChange={(e) => setProjectId(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 text-zinc-900 dark:text-white"
                        >
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Priority</label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 text-zinc-900 dark:text-white"
                        >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">Cancel</button>
                        <button type="submit" disabled={loading || !title.trim()} className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50">
                            {loading ? "Creating..." : "Create Task"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
