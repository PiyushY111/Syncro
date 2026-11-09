import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import api from '@/configs/api';
import OwnerSecurityAlerts from './OwnerSecurityAlerts';
import OwnerPurgeModal from './OwnerPurgeModal';
import OwnerRollbackCenter from './OwnerRollbackCenter';
import OwnerExportPanel from './OwnerExportPanel';
import { Crown, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OwnerAuditView() {
    const currentWorkspace = useSelector((state) => state?.workspace?.currentWorkspace);
    const navigate = useNavigate();

    const [logs, setLogs] = useState([]);
    const [isPurgeOpen, setIsPurgeOpen] = useState(false);

    const fetchLogs = useCallback(async () => {
        if (!currentWorkspace?.id) return;
        try {
            const res = await api.get(`/api/audit/workspace/${currentWorkspace.id}`, { params: { limit: 100 } });
            setLogs(res.data.logs || []);
        } catch (err) {
            console.error(err);
        }
    }, [currentWorkspace?.id]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    return (
        <div className="space-y-6 max-w-5xl mx-auto text-xs">
            <div className="sx-glass sx-rise flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-6 rounded-3xl">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/audit-logs')} className="p-2 rounded-lg bg-slate-500/[0.08] dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 cursor-pointer">
                        <ArrowLeft className="size-4" />
                    </button>
                    <div className="sx-tile sx-tile-amber">
                        <Crown className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Owner Security Command Center</h1>
                        <p className="mt-0.5 text-sm text-slate-500 dark:text-zinc-400">Executive security oversight, anomaly alerts, purge management, and compliance exports</p>
                    </div>
                </div>

                <button
                    onClick={() => setIsPurgeOpen(true)}
                    className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                    <Trash2 className="size-4" /> Purge Audit History
                </button>
            </div>

            <OwnerExportPanel logs={logs} />
            <OwnerSecurityAlerts logs={logs} />
            <OwnerRollbackCenter logs={logs} onRefresh={fetchLogs} />

            <OwnerPurgeModal
                isOpen={isPurgeOpen}
                onClose={() => setIsPurgeOpen(false)}
                workspaceId={currentWorkspace?.id}
                onPurgeSuccess={fetchLogs}
            />
        </div>
    );
}
