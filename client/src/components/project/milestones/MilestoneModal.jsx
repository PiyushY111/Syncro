import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function MilestoneModal({ isOpen, onClose, onSave, editingMilestone }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [status, setStatus] = useState('PLANNED');
    const [color, setColor] = useState('#3B82F6');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editingMilestone) {
            setTitle(editingMilestone.title || '');
            setDescription(editingMilestone.description || '');
            setDueDate(editingMilestone.dueDate ? editingMilestone.dueDate.split('T')[0] : '');
            setStatus(editingMilestone.status || 'PLANNED');
            setColor(editingMilestone.color || '#3B82F6');
        } else {
            setTitle('');
            setDescription('');
            setDueDate('');
            setStatus('PLANNED');
            setColor('#3B82F6');
        }
        setIsSubmitting(false);
    }, [editingMilestone, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onSave({ title, description, dueDate, status, color });
        } finally {
            setIsSubmitting(false);
        }
    };

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-[#14161f] border border-slate-900/[0.07] dark:border-white/[0.07] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-900/[0.05] dark:border-white/[0.07] pb-3">
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                        {editingMilestone ? 'Edit Milestone' : 'Create New Milestone'}
                    </h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer">
                        <X className="size-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                    <div>
                        <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Title *</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g., MVP Launch"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-500/[0.05] dark:bg-white/[0.06] border border-slate-900/[0.07] dark:border-white/10 rounded-lg text-zinc-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
                        <textarea
                            rows={2}
                            placeholder="Key goals & deliverables..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-500/[0.05] dark:bg-white/[0.06] border border-slate-900/[0.07] dark:border-white/10 rounded-lg text-zinc-900 dark:text-white"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Target Due Date *</label>
                            <input
                                type="date"
                                required
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-500/[0.05] dark:bg-white/[0.06] border border-slate-900/[0.07] dark:border-white/10 rounded-lg text-zinc-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-500/[0.05] dark:bg-white/[0.06] border border-slate-900/[0.07] dark:border-white/10 rounded-lg text-zinc-900 dark:text-white"
                            >
                                <option value="PLANNED">PLANNED</option>
                                <option value="IN_PROGRESS">IN_PROGRESS</option>
                                <option value="ACHIEVED">ACHIEVED</option>
                                <option value="MISSED">MISSED</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Badge Color</label>
                        <div className="flex items-center gap-2">
                            {colors.map((c) => (
                                <button
                                    type="button"
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`size-6 rounded-full transition ${color === c ? 'ring-2 ring-offset-2 ring-brand/40 scale-110' : ''}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-900/[0.05] dark:border-white/[0.07]">
                        <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg border border-slate-900/[0.07] dark:border-white/10 text-zinc-700 dark:text-zinc-300">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-3.5 py-1.5 rounded-lg bg-brand text-white font-medium hover:bg-brand-strong disabled:opacity-50 cursor-pointer">{isSubmitting ? "Saving..." : "Save"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
