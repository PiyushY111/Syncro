import { useState } from 'react';
import { X, Check } from 'lucide-react';

export default function CreatePortfolioModal({ isOpen, onClose, onSave, workspaceProjects }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#6366F1');
    const [selectedProjectIds, setSelectedProjectIds] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const toggleProject = (pid) => {
        setSelectedProjectIds((prev) =>
            prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onSave({ name, description, color, projectIds: selectedProjectIds });
        } finally {
            setIsSubmitting(false);
        }
    };

    const colors = ['#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Create Portfolio</h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer">
                        <X className="size-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                    <div>
                        <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Portfolio Name *</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g., Q3 Mobile Product Suite"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
                        <textarea
                            rows={2}
                            placeholder="High level enterprise objective..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Theme Color</label>
                        <div className="flex items-center gap-2">
                            {colors.map((c) => (
                                <button
                                    type="button"
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`size-6 rounded-full transition ${color === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : ''}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Select Grouped Projects</label>
                        <div className="max-h-36 overflow-y-auto space-y-1 pr-1 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 bg-zinc-50 dark:bg-zinc-800/40">
                            {workspaceProjects.map((proj) => {
                                const isSelected = selectedProjectIds.includes(proj.id);
                                return (
                                    <div
                                        key={proj.id}
                                        onClick={() => toggleProject(proj.id)}
                                        className={`p-2 rounded cursor-pointer flex items-center justify-between transition ${isSelected ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}
                                    >
                                        <span className="truncate">{proj.name}</span>
                                        {isSelected && <Check className="size-3.5 text-indigo-600 dark:text-indigo-400" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                        <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 cursor-pointer">{isSubmitting ? "Creating..." : "Create Portfolio"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
