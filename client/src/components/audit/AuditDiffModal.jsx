import { useState } from 'react';
import { X, RotateCcw, ArrowRight } from 'lucide-react';
import api from '@/configs/api';
import toast from 'react-hot-toast';

export default function AuditDiffModal({ isOpen, onClose, log, canRollback, onRollbackSuccess }) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !log) return null;

    const details = typeof log.details === 'object' && log.details ? log.details : {};
    const prev = details.previousState || {};
    const curr = details.newState || {};

    const keys = Array.from(new Set([...Object.keys(prev), ...Object.keys(curr)]));

    const handleRollback = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await api.post('/api/audit/rollback', { logId: log.id });
            toast.success('Successfully rolled back to target version');
            onClose();
            if (onRollbackSuccess) onRollbackSuccess();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to rollback entity');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl text-xs">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <div>
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Version Diff Inspector</h3>
                        <p className="text-[11px] text-zinc-400">{log.entityType}: {log.entityName || 'Entity'}</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer">
                        <X className="size-4" />
                    </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {keys.length === 0 ? (
                        <p className="text-zinc-400 italic">No structured diff payload stored for this action.</p>
                    ) : (
                        keys.map((k) => (
                            <div key={k} className="p-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg space-y-1">
                                <span className="font-semibold text-purple-600 dark:text-purple-400 uppercase text-[10px]">{k}</span>
                                <div className="grid grid-cols-2 gap-2 text-zinc-700 dark:text-zinc-300">
                                    <div className="bg-rose-500/10 p-1.5 rounded text-rose-600 dark:text-rose-400 truncate">
                                        <span className="font-bold text-[10px]">Previous: </span>
                                        {typeof prev[k] === 'object' ? JSON.stringify(prev[k]) : String(prev[k] ?? 'null')}
                                    </div>
                                    <div className="bg-emerald-500/10 p-1.5 rounded text-emerald-600 dark:text-emerald-400 truncate">
                                        <span className="font-bold text-[10px]">New: </span>
                                        {typeof curr[k] === 'object' ? JSON.stringify(curr[k]) : String(curr[k] ?? 'null')}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <p className="text-[10px] text-zinc-400">IP: {details.ipAddress || '127.0.0.1'}</p>
                    <div className="flex gap-2">
                        {canRollback && (log.entityType === 'TASK' || log.entityType === 'PROJECT') && (
                            <button
                                onClick={handleRollback}
                                disabled={isSubmitting}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition disabled:opacity-50 cursor-pointer"
                            >
                                <RotateCcw className="size-3.5" /> Rollback to this Version
                            </button>
                        )}
                        <button onClick={onClose} className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 font-medium">Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
