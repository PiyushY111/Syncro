import { RotateCcw, Clock } from 'lucide-react';
import api from '@/configs/api';
import toast from 'react-hot-toast';

export default function OwnerRollbackCenter({ logs = [], onRefresh }) {
    const rollbackableLogs = logs.filter(l => l.entityType === 'TASK' || l.entityType === 'PROJECT');

    const handleExecuteRollback = async (logId) => {
        try {
            await api.post('/api/audit/rollback', { logId });
            toast.success('System state successfully rolled back to target version');
            if (onRefresh) onRefresh();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Rollback failed');
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">System-Wide Time Travel Rollback Management</h3>
                    <p className="text-[11px] text-zinc-400">Restore tasks and projects to any previous historical snapshot</p>
                </div>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 max-h-64 overflow-y-auto">
                {rollbackableLogs.map((log) => (
                    <div key={log.id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
                                <Clock className="size-4" />
                            </div>
                            <div>
                                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{log.entityName || 'Entity'}</p>
                                <span className="text-[10px] text-zinc-400">{log.entityType} • {new Date(log.createdAt).toLocaleString()}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => handleExecuteRollback(log.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold cursor-pointer"
                        >
                            <RotateCcw className="size-3.5" /> Restore Version
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
