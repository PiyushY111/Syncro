import { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, X, RefreshCw, Hash, Lock, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/configs/api';

export default function AuditChainVerifyModal({ isOpen, onClose, workspaceId }) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const runVerification = async () => {
        if (!workspaceId) return;
        setLoading(true);
        try {
            const { data } = await api.get(`/api/audit/workspace/${workspaceId}/verify`);
            const payload = data?.data || data;
            setResult(payload);
        } catch (error) {
            console.error('Audit chain verification failed:', error);
            toast.error(error.response?.data?.message || 'Failed to verify audit hash chain');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            runVerification();
        } else {
            setResult(null);
        }
    }, [isOpen, workspaceId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 text-left overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl ${
                            result?.isValid
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                                : result && !result.isValid
                                ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                                : 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                        }`}>
                            {result?.isValid ? (
                                <ShieldCheck className="size-5" />
                            ) : result && !result.isValid ? (
                                <ShieldAlert className="size-5" />
                            ) : (
                                <Lock className="size-5" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                                Cryptographic Hash Chain Verification
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Real-time immutable SHA-256 audit trail verification
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="py-5 space-y-4">
                    {loading ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-500">
                            <RefreshCw className="size-8 animate-spin text-purple-600" />
                            <p className="text-sm font-medium">Hashing and verifying audit logs...</p>
                            <p className="text-xs text-zinc-400">Validating backwards SHA-256 cryptographic linkage</p>
                        </div>
                    ) : result?.isValid ? (
                        <div className="space-y-4">
                            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="size-9 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                        <CheckCircle2 className="size-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                                            Audit Log Hash Chain 100% Verified
                                        </h4>
                                        <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                                            Zero tampering detected. All historical operations match their cryptographic digests.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-300">
                                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60">
                                    <span className="text-zinc-500 font-medium">Verified Audit Records</span>
                                    <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                                        {result.totalLogs ?? result.verifiedCount ?? 0}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60">
                                    <span className="text-zinc-500 font-medium">Cryptographic Algorithm</span>
                                    <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                                        SHA-256 Linked Chain
                                    </span>
                                </div>

                                {result.lastHash && (
                                    <div className="py-2 px-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60">
                                        <div className="text-zinc-500 font-medium mb-1 flex items-center gap-1">
                                            <Hash className="size-3.5" /> Latest Chain Hash
                                        </div>
                                        <div className="font-mono text-[11px] text-zinc-800 dark:text-zinc-200 break-all select-all">
                                            {result.lastHash}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : result && !result.isValid ? (
                        <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 p-4">
                            <div className="flex items-start gap-3">
                                <ShieldAlert className="size-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-red-950 dark:text-red-200">
                                        Tampering Detected in Audit Log Chain
                                    </h4>
                                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                                        {result.error || `A hash signature mismatch occurred at record ID: ${result.corruptedLogId || 'unknown'}`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                        type="button"
                        onClick={runVerification}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                        Re-verify
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 rounded-lg transition cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
