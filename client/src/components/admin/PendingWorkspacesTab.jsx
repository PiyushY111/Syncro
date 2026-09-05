import React from 'react';
import { CheckCircle2, Check, XCircle } from 'lucide-react';

export default function PendingWorkspacesTab({ pendingWorkspaces, onApproveWorkspace, onRejectWorkspace }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Pending Workspace Creation Requests</span>
                    <span className="text-xs font-normal text-slate-500">({pendingWorkspaces.length} awaiting review)</span>
                </h2>
            </div>

            {pendingWorkspaces.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                    <CheckCircle2 className="size-12 text-blue-500 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">No Pending Workspace Requests</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                        All organization and team space provisioning requests have been processed.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingWorkspaces.map((pWb) => (
                        <div
                            key={pWb.id}
                            className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between hover:border-blue-500/50 transition"
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-base border border-blue-200 dark:border-blue-800">
                                            🏢
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{pWb.name}</h4>
                                            <p className="text-xs text-slate-500 font-mono">slug: {pWb.slug}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                        WAITING PROVISION
                                    </span>
                                </div>

                                {pWb.description && (
                                    <p className="text-xs text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800">
                                        {pWb.description}
                                    </p>
                                )}

                                <div className="text-xs text-slate-500 dark:text-zinc-400 space-y-1 pt-1">
                                    <div>
                                        Requested by: <span className="font-semibold text-slate-800 dark:text-zinc-200">{pWb.owner?.name}</span> ({pWb.owner?.email})
                                    </div>
                                    <div>Date: {new Date(pWb.createdAt).toLocaleString()}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-5 border-t border-slate-100 dark:border-zinc-800 mt-4">
                                <button
                                    onClick={() => onApproveWorkspace(pWb.id)}
                                    className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                                >
                                    <Check className="size-3.5" />
                                    Approve & Provision
                                </button>
                                <button
                                    onClick={() => onRejectWorkspace(pWb.id)}
                                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-zinc-800 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-zinc-300 dark:hover:text-rose-400 font-semibold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                                >
                                    <XCircle className="size-3.5" />
                                    Decline
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
