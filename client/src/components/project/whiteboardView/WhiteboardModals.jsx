import { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export function CreateBoardModal({ isOpen, onClose, onCreate, projects = [] }) {
    const [name, setName] = useState('Sprint Board');
    const [projectId, setProjectId] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName('Sprint Board');
            setProjectId('');
            setIsPrivate(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 text-left">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 w-full max-w-md text-zinc-900 dark:text-zinc-200 relative shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-250 cursor-pointer">
                    <X className="size-5" />
                </button>
                <h3 className="text-lg font-bold mb-4">Create New Whiteboard</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Whiteboard Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Design Board" className="w-full px-3.5 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" autoFocus />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Associate with Project (Optional)</label>
                        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full px-3.5 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                            <option value="">None (Workspace Wide)</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Visibility</label>
                        <select value={isPrivate ? 'private' : 'public'} onChange={(e) => setIsPrivate(e.target.value === 'private')} className="w-full px-3.5 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                            <option value="public">Public (Everyone in Workspace)</option>
                            <option value="private">Private (Only Creator & Shared Emails)</option>
                        </select>
                    </div>
                    <div className="flex gap-3 justify-end pt-2">
                        <button onClick={onClose} className="px-4 py-2 border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg text-sm font-semibold cursor-pointer">
                            Cancel
                        </button>
                        <button onClick={() => { if (name.trim()) onCreate(name.trim(), projectId || null, isPrivate); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold cursor-pointer shadow-md shadow-blue-500/10">
                            Create Board
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ConfirmDeleteModal({ isOpen, onClose, onConfirm, boardName }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 text-left">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 w-full max-w-md text-zinc-900 dark:text-zinc-200 relative shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-250 cursor-pointer">
                    <X className="size-5" />
                </button>
                <div className="flex gap-3.5 mb-4">
                    <div className="p-2 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg h-fit">
                        <AlertTriangle className="size-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Delete Whiteboard</h3>
                        <p className="text-sm text-zinc-500 mt-1">Are you sure you want to delete <span className="font-semibold text-zinc-800 dark:text-zinc-200">"{boardName}"</span>? This action cannot be undone.</p>
                    </div>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                    <button onClick={onClose} className="px-4 py-2 border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg text-sm font-semibold cursor-pointer">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold cursor-pointer shadow-md shadow-red-500/10">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

