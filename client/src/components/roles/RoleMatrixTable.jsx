import { Check, X, Trash2 } from 'lucide-react';

export default function RoleMatrixTable({ roleMatrix, customRoles = [], onToggleFeature, onDeleteCustomRole, isOwner, canManagePortal }) {
    const featureLabels = [
        { key: 'createProject', label: 'Create Projects', category: 'Projects' },
        { key: 'editProject', label: 'Edit Project Settings', category: 'Projects' },
        { key: 'deleteProject', label: 'Delete Projects', category: 'Projects' },
        { key: 'createTasks', label: 'Create & Assign Tasks', category: 'Tasks' },
        { key: 'editTasks', label: 'Edit & Move Tasks', category: 'Tasks' },
        { key: 'deleteTasks', label: 'Delete Tasks', category: 'Tasks' },
        { key: 'manageMilestones', label: 'Manage Project Milestones', category: 'Milestones' },
        { key: 'managePortfolios', label: 'Manage Executive Portfolios', category: 'Portfolios' },
        { key: 'viewAnalytics', label: 'Access Project Analytics', category: 'Analytics' },
        { key: 'manageMembers', label: 'Manage Workspace Members', category: 'Team' },
        { key: 'manageWhiteboards', label: 'Manage Whiteboards', category: 'Whiteboard' },
        { key: 'manageChannels', label: 'Manage Channels', category: 'Chat' },
        { key: 'manageSubTeams', label: 'Manage Sub-Teams', category: 'Sub-Teams' }
    ];

    const standardRoles = ['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'];
    const allRoles = [...standardRoles, ...customRoles.map(c => c.key)];
    const hasManageAccess = canManagePortal || isOwner;

    return (
        <div className="bg-white/60 dark:bg-white/[0.03] rounded-xl border border-slate-900/[0.07] dark:border-white/[0.07] overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
                <thead>
                    <tr className="border-b border-slate-900/[0.07] dark:border-white/[0.07] bg-slate-500/[0.05] dark:bg-white/[0.06] text-zinc-500">
                        <th className="p-3.5 font-semibold min-w-[200px]">Feature Capability</th>
                        {allRoles.map((r) => {
                            const customObj = customRoles.find(c => c.key === r);
                            return (
                                <th key={r} className="p-3.5 font-semibold text-center min-w-[110px]">
                                    <div className="flex items-center justify-center gap-1">
                                        <span style={customObj ? { color: customObj.color } : {}}>{customObj ? customObj.label : r}</span>
                                        {customObj && hasManageAccess && (
                                            <button onClick={() => onDeleteCustomRole(customObj.key)} className="text-zinc-400 hover:text-rose-500 transition cursor-pointer" title="Delete custom role">
                                                <Trash2 className="size-3" />
                                            </button>
                                        )}
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/[0.06] dark:divide-white/[0.06]">
                    {featureLabels.map((f) => (
                        <tr key={f.key} className="hover:bg-slate-500/[0.06] dark:hover:bg-white/[0.07] transition">
                            <td className="p-3.5 font-medium text-zinc-800 dark:text-zinc-200">
                                <div>
                                    <p>{f.label}</p>
                                    <span className="text-[10px] text-zinc-400 font-normal">{f.category}</span>
                                </div>
                            </td>
                            {allRoles.map((r) => {
                                const isAllowed = roleMatrix?.[r]?.[f.key] ?? false;
                                return (
                                    <td key={r} className="p-3.5 text-center">
                                        <button
                                            type="button"
                                            disabled={!hasManageAccess}
                                            onClick={() => onToggleFeature(r, f.key, !isAllowed)}
                                            className={`inline-flex items-center justify-center size-7 rounded-lg transition cursor-pointer ${isAllowed ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-500'}`}
                                        >
                                            {isAllowed ? <Check className="size-4" /> : <X className="size-4" />}
                                        </button>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

