import { useState } from 'react';
import { Search } from 'lucide-react';

export default function RoleMembersList({ members, customRoles = [], onUpdateMemberRole, isOwner, canManagePortal }) {
    const [search, setSearch] = useState('');

    const standardRoles = ['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'];
    const customRoleKeys = customRoles.map(c => ({ key: c.key, label: c.label }));
    const hasManageAccess = canManagePortal || isOwner;

    const filtered = members.filter((m) =>
        (m.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.user?.email || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="sx-glass rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">Workspace Team Members ({members.length})</h3>
                <div className="relative max-w-xs w-full">
                    <Search className="absolute left-3 top-2.5 size-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search members..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-500/[0.05] dark:bg-white/[0.06] border border-slate-900/[0.07] dark:border-white/10 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-brand"
                    />
                </div>
            </div>

            <div className="divide-y divide-slate-900/[0.06] dark:divide-white/[0.06] text-xs">
                {filtered.map((m) => (
                    <div key={m.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-xs">
                                {m.user?.name ? m.user.name[0].toUpperCase() : 'U'}
                            </div>
                            <div>
                                <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{m.user?.name || 'User'}</h4>
                                <p className="text-[11px] text-zinc-400">{m.user?.email}</p>
                            </div>
                        </div>

                        <select
                            value={m.role}
                            disabled={!hasManageAccess}
                            onChange={(e) => onUpdateMemberRole(m.userId, e.target.value)}
                            className="px-3 py-1.5 rounded-lg bg-slate-500/[0.05] dark:bg-white/[0.06] border border-slate-900/[0.07] dark:border-white/10 text-zinc-900 dark:text-zinc-100 font-medium cursor-pointer disabled:opacity-60"
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
