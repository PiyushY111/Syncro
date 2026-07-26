import { ShieldCheck, Layers, FileCheck } from 'lucide-react';

export default function RoleCapabilitiesCard({ roleMatrix }) {
    const roles = [
        { name: 'ADMIN', color: 'border-purple-500/20 bg-purple-500/5 text-purple-600 dark:text-purple-400' },
        { name: 'MANAGER', color: 'border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400' },
        { name: 'MEMBER', color: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400' },
        { name: 'VIEWER', color: 'border-zinc-500/20 bg-zinc-500/5 text-zinc-600 dark:text-zinc-400' }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {roles.map((r) => {
                const perms = roleMatrix?.[r.name] || {};
                const allowedCount = Object.values(perms).filter(Boolean).length;
                const totalCount = Object.keys(perms).length || 13;
                return (
                    <div key={r.name} className={`p-4 rounded-xl border ${r.color} space-y-2`}>
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm">{r.name}</h4>
                            <span className="text-[11px] font-semibold">{allowedCount} / {totalCount} Active</span>
                        </div>
                        <p className="text-[11px] opacity-80">
                            {r.name === 'ADMIN' && 'Full administrative management'}
                            {r.name === 'MANAGER' && 'Project & task lead capabilities'}
                            {r.name === 'MEMBER' && 'Day-to-day execution & task completion'}
                            {r.name === 'VIEWER' && 'Read-only audit & analytics access'}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}
