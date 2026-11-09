import { useState, useEffect, useCallback } from 'react';
import api from '@/configs/api';
import { Clock, RotateCcw, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EntityVersionTimeline({ entityType, entityId, canRollback }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = useCallback(async () => {
        if (!entityType || !entityId) return;
        try {
            const res = await api.get(`/api/audit/entity/${entityType}/${entityId}`);
            setHistory(res.data.history || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [entityType, entityId]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleRollback = async (logId) => {
        try {
            await api.post('/api/audit/rollback', { logId });
            toast.success('Rolled back version');
            fetchHistory();
        } catch {
            toast.error('Rollback failed');
        }
    };

    if (loading) return <div className="p-4 text-xs text-zinc-400">Loading version history...</div>;

    if (history.length === 0) {
        return <div className="p-6 text-center text-xs text-zinc-400 border border-dashed border-slate-900/[0.07] dark:border-white/[0.07] rounded-xl">No version history records recorded yet.</div>;
    }

    return (
        <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-200">
                <Clock className="size-4 text-brand dark:text-violet-300" />
                Version History Timeline ({history.length})
            </div>

            <div className="relative pl-4 border-l border-slate-900/[0.07] dark:border-white/[0.07] space-y-4">
                {history.map((item) => (
                    <div key={item.id} className="relative group">
                        <div className="absolute -left-[21px] top-0.5 size-2.5 rounded-full bg-brand ring-4 ring-white dark:ring-zinc-900" />
                        <div className="bg-slate-500/[0.05] dark:bg-white/[0.06] p-3 rounded-lg border border-slate-900/[0.05] dark:border-white/[0.07] space-y-1">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{item.user?.name || 'User'}</span>
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand/10 text-brand dark:text-violet-300">{item.action}</span>
                                </div>
                                <span className="text-[10px] text-zinc-400">{new Date(item.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-[11px] text-zinc-500">{item.entityName}</p>
                            {canRollback && (
                                <button
                                    onClick={() => handleRollback(item.id)}
                                    className="mt-1 flex items-center gap-1 text-[10px] text-brand dark:text-violet-300 hover:text-brand font-semibold cursor-pointer"
                                >
                                    <RotateCcw className="size-3" /> Rollback to this state
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
