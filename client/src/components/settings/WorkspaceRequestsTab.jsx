import { useState, useEffect, useCallback } from 'react';
import { Clock, XCircle, RefreshCw, Trash2, Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/configs/api';

export default function WorkspaceRequestsTab() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    const fetchRequests = useCallback(async (showToast = false) => {
        try {
            setLoading(true);
            const { data } = await api.get('/api/workspaces/my-requests');
            const payload = data?.data || data;
            setRequests(payload.requests || []);
            if (showToast) {
                toast.success('Requests status updated');
            }
        } catch (error) {
            console.error('[WorkspaceRequestsTab] Error loading requests:', error);
            if (showToast) {
                toast.error(error.response?.data?.message || 'Failed to load workspace requests');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests(false);
    }, [fetchRequests]);

    const handleDeleteRequest = async (id, name) => {
        if (!window.confirm(`Are you sure you want to remove the request for "${name}"?`)) return;
        setDeletingId(id);
        try {
            await api.delete(`/api/workspaces/my-requests/${id}`);
            toast.success('Request removed');
            setRequests((prev) => prev.filter((r) => r.id !== id));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to remove request');
        } finally {
            setDeletingId(null);
        }
    };

    if (loading && requests.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw className="size-6 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-200 dark:border-zinc-800">
                <div>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Workspace Requests & Approvals</h2>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                        Track the status of your organization creation and personal workspace requests submitted for Super-Admin review.
                    </p>
                </div>
                <button
                    onClick={() => fetchRequests(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 transition cursor-pointer self-start sm:self-auto"
                >
                    <RefreshCw className="size-3.5" />
                    Refresh Status
                </button>
            </div>

            {/* List */}
            {requests.length === 0 ? (
                <div className="p-10 text-center rounded-2xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-800">
                    <CheckCircle2 className="size-10 text-emerald-500 mx-auto mb-2.5 opacity-80" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">No Pending or Rejected Requests</h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                        All your workspace requests have been approved or you haven't submitted any new creation requests recently.
                    </p>
                </div>
            ) : (
                <div className="space-y-3.5">
                    {requests.map((req) => {
                        const isPending = req.approvalStatus === 'PENDING';
                        const isRejected = req.approvalStatus === 'REJECTED';

                        return (
                            <div
                                key={req.id}
                                className={`p-5 rounded-2xl border transition-all ${
                                    isPending
                                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                                        : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                                }`}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                    <div className="flex items-start gap-3 min-w-0 flex-1">
                                        <div
                                            className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                isPending
                                                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                                                    : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                                            }`}
                                        >
                                            {isPending ? <Clock className="size-5 animate-pulse" /> : <XCircle className="size-5" />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                                    {req.name}
                                                </h4>
                                                <span
                                                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                                                        isPending
                                                            ? 'bg-amber-200/80 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                                                            : 'bg-rose-200/80 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300'
                                                    }`}
                                                >
                                                    {isPending ? 'Under Review' : 'Declined'}
                                                </span>
                                            </div>

                                            {req.description && (
                                                <p className="text-xs text-gray-600 dark:text-zinc-300 mt-1">
                                                    {req.description}
                                                </p>
                                            )}

                                            <div className="mt-2.5 text-xs text-gray-500 dark:text-zinc-400 space-y-1">
                                                {isPending && (
                                                    <p className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                                                        <AlertCircle className="size-3.5 shrink-0" />
                                                        <span>Awaiting platform Super-Admin review. You will receive an email once approved.</span>
                                                    </p>
                                                )}

                                                {isRejected && (
                                                    <div className="p-2.5 rounded-xl bg-rose-100/60 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300">
                                                        <p className="font-semibold text-[11px]">Reason for decline:</p>
                                                        <p className="text-xs mt-0.5">{req.requestNotes || 'No specific reason provided.'}</p>
                                                    </div>
                                                )}

                                                <p className="text-[11px] text-gray-400 dark:text-zinc-500 pt-1 font-mono">
                                                    Submitted on: {new Date(req.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action button */}
                                    {isRejected && (
                                        <button
                                            onClick={() => handleDeleteRequest(req.id, req.name)}
                                            disabled={deletingId === req.id}
                                            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer self-start sm:self-auto disabled:opacity-50"
                                        >
                                            <Trash2 className="size-3.5" />
                                            Dismiss
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
