import { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import api from '@/configs/api';
import toast from 'react-hot-toast';

export default function OwnerPurgeModal({ isOpen, onClose, workspaceId, onPurgeSuccess }) {
    const [severityFilter, setSeverityFilter] = useState('ALL');
    const [olderThanDays, setOlderThanDays] = useState('0');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handlePurge = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const res = await api.delete(`/api/audit/workspace/${workspaceId}`, {
                data: { severityFilter, olderThanDays: parseInt(olderThanDays) }
            });
            toast.success(res.data.message || 'Audit logs purged');
            onClose();
            if (onPurgeSuccess) onPurgeSuccess();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to purge audit logs');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-[#14161f] border border-slate-900/[0.07] dark:border-white/[0.07] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl text-xs">
                <div className="flex items-center justify-between border-b border-slate-900/[0.05] dark:border-white/[0.07] pb-3">
                    <div className="flex items-center gap-2 text-rose-500 font-bold">
                        <AlertTriangle className="size-4" />
                        Owner Purge Audit History
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                        <X className="size-4" />
                    </button>
                </div>

                <form onSubmit={handlePurge} className="space-y-4">
                    <p className="text-zinc-500 text-[11px]">
                        As Workspace Owner, you are authorized to permanently purge audit log entries. This action cannot be undone.
                    </p>

                    <div>
                        <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Filter by Risk Severity</label>
                        <select
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-500/[0.05] dark:bg-white/[0.06] border border-slate-900/[0.07] dark:border-white/10 rounded-lg text-zinc-900 dark:text-white font-medium"
                        >
                            <option value="ALL">All Severities (Full Purge)</option>
                            <option value="INFO">INFO Logs Only</option>
                            <option value="WARNING">WARNING Logs Only</option>
                            <option value="CRITICAL">CRITICAL Logs Only</option>
                        </select>
                    </div>

                    <div>
                        <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Age Filter</label>
                        <select
                            value={olderThanDays}
                            onChange={(e) => setOlderThanDays(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-500/[0.05] dark:bg-white/[0.06] border border-slate-900/[0.07] dark:border-white/10 rounded-lg text-zinc-900 dark:text-white font-medium"
                        >
                            <option value="0">Purge All Matching (No age limit)</option>
                            <option value="7">Older than 7 days</option>
                            <option value="30">Older than 30 days</option>
                            <option value="90">Older than 90 days</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-900/[0.05] dark:border-white/[0.07]">
                        <button type="button" onClick={onClose} className="px-3 py-1.5 border border-slate-900/[0.07] dark:border-white/10 rounded-lg text-zinc-700 dark:text-zinc-300">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg disabled:opacity-50 cursor-pointer">
                            <Trash2 className="size-3.5" /> Purge Logs
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
