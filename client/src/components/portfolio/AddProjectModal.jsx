import { useState } from 'react';
import { X, Check } from 'lucide-react';

export default function AddProjectModal({ isOpen, onClose, onAdd, availableProjects }) {
    const [selectedIds, setSelectedIds] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const toggleProject = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onAdd(selectedIds);
            setSelectedIds([]);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Add Projects to Portfolio</h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer">
                        <X className="size-4" />
                    </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 text-xs">
                    {!availableProjects || availableProjects.length === 0 ? (
                        <p className="text-zinc-400 py-4 text-center">No additional workspace projects available.</p>
                    ) : (
                        availableProjects.map((p) => {
                            const isSelected = selectedIds.includes(p.id);
                            return (
                                <div
                                    key={p.id}
                                    onClick={() => toggleProject(p.id)}
                                    className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition ${isSelected ? 'border-indigo-500 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400' : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200'}`}
                                >
                                    <span className="font-medium truncate">{p.name}</span>
                                    <div className={`size-4 rounded flex items-center justify-center border ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-zinc-300 dark:border-zinc-700'}`}>
                                        {isSelected && <Check className="size-3" />}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <button onClick={onClose} className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs">Cancel</button>
                    <button onClick={handleSave} disabled={isSubmitting} className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 text-xs disabled:opacity-50 cursor-pointer">{isSubmitting ? "Adding..." : "Add Projects"}</button>
                </div>
            </div>
        </div>
    );
}
