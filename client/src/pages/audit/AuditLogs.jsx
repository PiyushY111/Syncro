import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '@/configs/api';
import AuditDashboardView from '@/components/audit/AuditDashboardView';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AuditLogs() {
    const currentWorkspace = useSelector((state) => state?.workspace?.currentWorkspace);
    const navigate = useNavigate();

    const [hasAccess, setHasAccess] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAccess = async () => {
            if (!currentWorkspace?.id) return;
            try {
                await api.get(`/api/audit/workspace/${currentWorkspace.id}`);
                setHasAccess(true);
            } catch (err) {
                if (err.response?.status === 403) setHasAccess(false);
            } finally {
                setLoading(false);
            }
        };
        checkAccess();
    }, [currentWorkspace?.id]);

    if (loading) return <div className="p-8 text-center text-xs text-zinc-500">Verifying audit dashboard authorization...</div>;

    if (!hasAccess) {
        return (
            <div className="p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl max-w-md mx-auto my-20 space-y-4">
                <div className="mx-auto size-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <ShieldAlert className="size-6" />
                </div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-lg">Access Restricted</h3>
                <p className="text-xs text-zinc-500">
                    Audit Logs are restricted to Workspace Owner, Admins, and Managers.
                </p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition cursor-pointer"
                >
                    <ArrowLeft className="size-4" /> Return to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto text-zinc-900 dark:text-white">
            <AuditDashboardView />
        </div>
    );
}
