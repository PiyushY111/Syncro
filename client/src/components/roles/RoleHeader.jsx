import { ShieldCheck, UserCheck, Lock, Plus, Sparkles } from 'lucide-react';

export default function RoleHeader({ activeTab, setActiveTab, isOwner, canManagePortal, allowManagerPortalAccess, onToggleManagerAccess, isSaving, onOpenCustomModal, onApplyPreset }) {
    const presets = [
        { name: 'Strict Enterprise', matrix: { ADMIN: { createProject: true, editProject: true, deleteProject: true, createTasks: true, editTasks: true, deleteTasks: true, manageMilestones: true, managePortfolios: true, viewAnalytics: true, manageMembers: true }, MANAGER: { createProject: true, editProject: true, deleteProject: false, createTasks: true, editTasks: true, deleteTasks: true, manageMilestones: true, managePortfolios: true, viewAnalytics: true, manageMembers: false }, MEMBER: { createProject: false, editProject: false, deleteProject: false, createTasks: true, editTasks: true, deleteTasks: false, manageMilestones: false, managePortfolios: false, viewAnalytics: true, manageMembers: false }, VIEWER: { createProject: false, editProject: false, deleteProject: false, createTasks: false, editTasks: false, deleteTasks: false, manageMilestones: false, managePortfolios: false, viewAnalytics: true, manageMembers: false } } },
        { name: 'Open Team', matrix: { ADMIN: { createProject: true, editProject: true, deleteProject: true, createTasks: true, editTasks: true, deleteTasks: true, manageMilestones: true, managePortfolios: true, viewAnalytics: true, manageMembers: true }, MANAGER: { createProject: true, editProject: true, deleteProject: true, createTasks: true, editTasks: true, deleteTasks: true, manageMilestones: true, managePortfolios: true, viewAnalytics: true, manageMembers: true }, MEMBER: { createProject: true, editProject: true, deleteProject: false, createTasks: true, editTasks: true, deleteTasks: true, manageMilestones: true, managePortfolios: false, viewAnalytics: true, manageMembers: false }, VIEWER: { createProject: false, editProject: false, deleteProject: false, createTasks: false, editTasks: false, deleteTasks: false, manageMilestones: false, managePortfolios: false, viewAnalytics: true, manageMembers: false } } }
    ];

    const hasManageAccess = canManagePortal || isOwner;

    return (
        <div className="sx-glass sx-rise flex flex-col gap-4 p-6 rounded-3xl">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="sx-tile">
                        <ShieldCheck className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Role-Based Permissions Portal</h1>
                        <p className="mt-0.5 text-sm text-slate-500 dark:text-zinc-400">Configure custom roles, feature access levels, and team role assignments</p>
                    </div>
                </div>

                {hasManageAccess && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onOpenCustomModal}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand hover:bg-brand-strong rounded-lg transition shadow-xs cursor-pointer"
                        >
                            <Plus className="size-4" /> Custom Role
                        </button>

                        {isOwner && (
                            <div className="flex items-center gap-2 bg-slate-500/[0.05] dark:bg-white/[0.06] p-2 rounded-xl border border-slate-900/[0.07] dark:border-white/10 text-xs">
                                <span className="font-medium text-zinc-700 dark:text-zinc-300">Manager Access</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={allowManagerPortalAccess} onChange={(e) => onToggleManagerAccess(e.target.checked)} disabled={isSaving} className="sr-only peer" />
                                    <div className="w-8 h-4 bg-zinc-300 peer-focus:outline-hidden rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:after:border-zinc-600 peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-900/[0.05] dark:border-white/[0.07] pt-3 text-xs">
                <div className="flex items-center gap-2 font-semibold">
                    <button onClick={() => setActiveTab('matrix')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition cursor-pointer ${activeTab === 'matrix' ? 'bg-brand text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}>
                        <ShieldCheck className="size-4" /> Feature Matrix
                    </button>
                    <button onClick={() => setActiveTab('members')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition cursor-pointer ${activeTab === 'members' ? 'bg-brand text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}>
                        <UserCheck className="size-4" /> Team Member Roles
                    </button>
                </div>

                {hasManageAccess && activeTab === 'matrix' && (
                    <div className="flex items-center gap-1.5">
                        <Sparkles className="size-3.5 text-amber-500" />
                        <span className="text-zinc-400 text-[11px]">Presets:</span>
                        {presets.map((p) => (
                            <button key={p.name} onClick={() => onApplyPreset(p.matrix)} className="px-2 py-1 rounded bg-slate-500/[0.08] dark:bg-white/[0.06] hover:bg-zinc-200 dark:hover:bg-white/[0.07] font-medium text-[11px] text-zinc-700 dark:text-zinc-300 cursor-pointer">
                                {p.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

