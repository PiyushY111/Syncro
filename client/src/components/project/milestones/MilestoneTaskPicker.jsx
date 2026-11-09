import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

export default function MilestoneTaskPicker({ isOpen, onClose, milestone, projectTasks, onSaveLinks }) {
    const [selectedIds, setSelectedIds] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (milestone && milestone.tasks) {
            setSelectedIds(milestone.tasks.map((t) => t.id));
        } else {
            setSelectedIds([]);
        }
        setIsSubmitting(false);
    }, [milestone, isOpen]);

    if (!isOpen || !milestone) return null;

    const toggleTask = (taskId) => {
        setSelectedIds((prev) =>
            prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
        );
    };

    const handleSave = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onSaveLinks(milestone.id, selectedIds);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-[#14161f] border border-slate-900/[0.07] dark:border-white/[0.07] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-900/[0.05] dark:border-white/[0.07] pb-3">
                    <div>
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Link Tasks to Milestone</h3>
                        <p className="text-xs text-zinc-500">{milestone.title}</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer">
                        <X className="size-4" />
                    </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 text-xs">
                    {!projectTasks || projectTasks.length === 0 ? (
                        <p className="text-zinc-400 py-4 text-center">No tasks available in this project.</p>
                    ) : (
                        projectTasks.map((task) => {
                            const isSelected = selectedIds.includes(task.id);
                            return (
                                <div
                                    key={task.id}
                                    onClick={() => toggleTask(task.id)}
                                    className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition ${isSelected ? 'border-brand dark:border-lime bg-blue-500/5 text-brand dark:text-violet-300' : 'border-slate-900/[0.07] dark:border-white/[0.07] hover:bg-slate-500/[0.06] dark:hover:bg-white/[0.07] text-zinc-800 dark:text-zinc-200'}`}
                                >
                                    <span className="font-medium truncate">{task.title}</span>
                                    <div className={`size-4 rounded flex items-center justify-center border ${isSelected ? 'bg-brand border-brand dark:border-lime text-white' : 'border-slate-900/10 dark:border-white/10'}`}>
                                        {isSelected && <Check className="size-3" />}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-900/[0.05] dark:border-white/[0.07]">
                    <button onClick={onClose} className="px-3 py-1.5 rounded-lg border border-slate-900/[0.07] dark:border-white/10 text-zinc-700 dark:text-zinc-300 text-xs">Cancel</button>
                    <button onClick={handleSave} disabled={isSubmitting} className="px-3.5 py-1.5 rounded-lg bg-brand text-white font-medium hover:bg-brand-strong text-xs disabled:opacity-50 cursor-pointer">{isSubmitting ? "Saving..." : "Save Links"}</button>
                </div>
            </div>
        </div>
    );
}
