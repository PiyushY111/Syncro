import React from 'react';
import { Search } from 'lucide-react';

export default function UserDirectoryTab({
    allUsers,
    userSearch,
    setUserSearch,
    onToggleSuperAdmin
}) {
    return (
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Registered Users Directory</h3>
                    <p className="text-xs text-slate-500">Manage account access, review workspaces, and assign Super-Admin status.</p>
                </div>

                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            placeholder="Search name or email..."
                            className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-500">
                            <th className="pb-3 font-semibold">User</th>
                            <th className="pb-3 font-semibold">Status</th>
                            <th className="pb-3 font-semibold">Super-Admin</th>
                            <th className="pb-3 font-semibold">Workspaces</th>
                            <th className="pb-3 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                        {allUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
                                <td className="py-3">
                                    <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                                    <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                                </td>
                                <td className="py-3">
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            u.status === 'ACTIVE'
                                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                                : u.status === 'PENDING_APPROVAL'
                                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                                : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                                        }`}
                                    >
                                        {u.status}
                                    </span>
                                </td>
                                <td className="py-3">
                                    {u.isSuperAdmin ? (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                                            👑 SUPER ADMIN
                                        </span>
                                    ) : (
                                        <span className="text-slate-400">Regular</span>
                                    )}
                                </td>
                                <td className="py-3 text-slate-600 dark:text-zinc-300">
                                    {u.workspaces?.length > 0 ? (
                                        <span className="font-medium">{u.workspaces.length} workspace(s)</span>
                                    ) : (
                                        <span className="text-slate-400">None</span>
                                    )}
                                </td>
                                <td className="py-3 text-right">
                                    <button
                                        onClick={() => onToggleSuperAdmin(u.id)}
                                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 transition cursor-pointer"
                                    >
                                        {u.isSuperAdmin ? 'Revoke SuperAdmin' : 'Make SuperAdmin'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
