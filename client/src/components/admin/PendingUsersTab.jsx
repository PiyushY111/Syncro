import React from 'react';
import { CheckCircle2, Clock, Check, XCircle } from 'lucide-react';

export default function PendingUsersTab({ pendingUsers, onApproveUser, onRejectUser }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Pending User Approvals</span>
                    <span className="text-xs font-normal text-slate-500">({pendingUsers.length} awaiting review)</span>
                </h2>
            </div>

            {pendingUsers.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                    <CheckCircle2 className="size-12 text-emerald-500 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">All Clear! No Pending Users</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                        Every registered user has been processed. New signup requests will appear here in real-time.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingUsers.map((pUser) => (
                        <div
                            key={pUser.id}
                            className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between hover:border-amber-500/50 transition"
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                                            {pUser.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{pUser.name}</h4>
                                            <p className="text-xs text-slate-500 font-mono">{pUser.email}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                                        PENDING
                                    </span>
                                </div>

                                <div className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 pt-1">
                                    <Clock className="size-3.5" />
                                    <span>Registered: {new Date(pUser.createdAt).toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-5 border-t border-slate-100 dark:border-zinc-800 mt-4">
                                <button
                                    onClick={() => onApproveUser(pUser.id)}
                                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                                >
                                    <Check className="size-3.5" />
                                    Approve Access
                                </button>
                                <button
                                    onClick={() => onRejectUser(pUser.id)}
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
