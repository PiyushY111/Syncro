import React from 'react';

export default function GatekeeperStats({ stats }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Pending Users</span>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className={`text-2xl font-extrabold ${stats.pendingUsersCount > 0 ? 'text-amber-600 dark:text-amber-400 animate-pulse' : 'text-slate-900 dark:text-white'}`}>
                        {stats.pendingUsersCount}
                    </span>
                    {stats.pendingUsersCount > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                            Action Needed
                        </span>
                    )}
                </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Pending Workspaces</span>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className={`text-2xl font-extrabold ${stats.pendingWorkspacesCount > 0 ? 'text-blue-600 dark:text-blue-400 animate-pulse' : 'text-slate-900 dark:text-white'}`}>
                        {stats.pendingWorkspacesCount}
                    </span>
                    {stats.pendingWorkspacesCount > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                            Action Needed
                        </span>
                    )}
                </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Active VIP Passes</span>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {stats.activeVipCodesCount}
                </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Total Workspaces</span>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {stats.totalWorkspaces}
                </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm col-span-2 md:col-span-1">
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Total Registered Users</span>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {stats.totalUsers}
                </div>
            </div>
        </div>
    );
}
