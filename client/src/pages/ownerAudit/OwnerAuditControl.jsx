import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '@/configs/api';
import OwnerAuditView from '@/components/ownerAudit/OwnerAuditView';
import { Crown, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OwnerAuditControl() {
    const currentWorkspace = useSelector((state) => state?.workspace?.currentWorkspace);
    const navigate = useNavigate();

    const [isOwner, setIsOwner] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkOwner = async () => {
            if (!currentWorkspace?.id) return;
            try {
                const res = await api.get(`/api/audit/workspace/${currentWorkspace.id}`);
                setIsOwner(res.data.isOwner || false);
            } catch {
                setIsOwner(false);
            } finally {
                setLoading(false);
            }
        };
        checkOwner();
    }, [currentWorkspace?.id]);

    if (loading) return <div className="p-8 text-center text-xs text-zinc-500">Verifying Workspace Owner security privileges...</div>;

    if (!isOwner) {
        return (
            <div className="p-12 text-center border border-dashed border-amber-500/30 bg-amber-500/5 rounded-xl max-w-md mx-auto my-20 space-y-4">
                <div className="mx-auto size-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Crown className="size-6" />
                </div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-lg">Workspace Owner Privilege Required</h3>
                <p className="text-xs text-zinc-500">
                    The Security Command Center and Log Purge Center are strictly reserved for the Workspace Owner.
                </p>
                <button
                    onClick={() => navigate('/audit-logs')}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition cursor-pointer"
                >
                    <ArrowLeft className="size-4" /> Return to Audit Logs
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto text-zinc-900 dark:text-white">
            <OwnerAuditView />
        </div>
    );
}
