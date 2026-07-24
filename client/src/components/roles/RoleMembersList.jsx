import { useState } from 'react';
import { Search } from 'lucide-react';

export default function RoleMembersList({ members, customRoles = [], onUpdateMemberRole, isOwner }) {
    const [search, setSearch] = useState('');

    const standardRoles = ['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'];
    const customRoleKeys = customRoles.map(c => ({ key: c.key, label: c.label }));

    const filtered = members.filter((m) =>
        (m.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.user?.email || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="bg-white dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">Workspace Team Members ({members.length})</h3>
                <div className="relative max-w-xs w-full">
                    <Search className="absolute left-3 top-2.5 size-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search members..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-indigo-500"
                    />
                </div>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
                {filtered.map((m) => (
                    <div key={m.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                {m.user?.name ? m.user.name[0].toUpperCase() : 'U'}
                            </div>
                            <div>
                                <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{m.user?.name || 'User'}</h4>
                                <p className="text-[11px] text-zinc-400">{m.user?.email}</p>
                            </div>
                        </div>

                        <select
                            value={m.role}
                            disabled={!isOwner}
                            onChange={(e) => onUpdateMemberRole(m.userId, e.target.value)}
                            className="px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium cursor-pointer disabled:opacity-60"
                        >
                            <optgroup label="Standard Roles">
                                {standardRoles.map((r) => (<option key={r} value={r}>{r}</option>))}
                            </optgroup>
                            {customRoleKeys.length > 0 && (
                                <optgroup label="Custom Roles">
                                    {customRoleKeys.map((c) => (<option key={c.key} value={c.key}>{c.label}</option>))}
                                </optgroup>
                            )}
                        </select>
                    </div>
                ))}
            </div>
        </div>
    );
}
