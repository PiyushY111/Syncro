import { ShieldCheck, UserCheck, Lock, Plus, Sparkles } from 'lucide-react';

export default function RoleHeader({ activeTab, setActiveTab, isOwner, canManagePortal, allowManagerPortalAccess, onToggleManagerAccess, isSaving, onOpenCustomModal, onApplyPreset }) {
    const presets = [
        { name: 'Strict Enterprise', matrix: { ADMIN: { createProject: true, editProject: true, deleteProject: true, createTasks: true, editTasks: true, deleteTasks: true, manageMilestones: true, managePortfolios: true, viewAnalytics: true, manageMembers: true }, MANAGER: { createProject: true, editProject: true, deleteProject: false, createTasks: true, editTasks: true, deleteTasks: true, manageMilestones: true, managePortfolios: true, viewAnalytics: true, manageMembers: false }, MEMBER: { createProject: false, editProject: false, deleteProject: false, createTasks: true, editTasks: true, deleteTasks: false, manageMilestones: false, managePortfolios: false, viewAnalytics: true, manageMembers: false }, VIEWER: { createProject: false, editProject: false, deleteProject: false, createTasks: false, editTasks: false, deleteTasks: false, manageMilestones: false, managePortfolios: false, viewAnalytics: true, manageMembers: false } } },
        { name: 'Open Team', matrix: { ADMIN: { createProject: true, editProject: true, deleteProject: true, createTasks: true, editTasks: true, deleteTasks: true, manageMilestones: true, managePortfolios: true, viewAnalytics: true, manageMembers: true }, MANAGER: { createProject: true, editProject: true, deleteProject: true, createTasks: true, editTasks: true, deleteTasks: true, manageMilestones: true, managePortfolios: true, viewAnalytics: true, manageMembers: true }, MEMBER: { createProject: true, editProject: true, deleteProject: false, createTasks: true, editTasks: true, deleteTasks: true, manageMilestones: true, managePortfolios: false, viewAnalytics: true, manageMembers: false }, VIEWER: { createProject: false, editProject: false, deleteProject: false, createTasks: false, editTasks: false, deleteTasks: false, manageMilestones: false, managePortfolios: false, viewAnalytics: true, manageMembers: false } } }
    ];

    const hasManageAccess = canManagePortal || isOwner;

    return (
        <div className="flex flex-col gap-4 bg-white dark:bg-zinc-900/60 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        <ShieldCheck className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Role-Based Permissions Portal</h1>
                        <p className="text-xs text-zinc-500">Configure custom roles, feature access levels, and team role assignments</p>
                    </div>
                </div>

                {hasManageAccess && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onOpenCustomModal}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-xs cursor-pointer"
                        >
                            <Plus className="size-4" /> Custom Role
                        </button>

                        {isOwner && (
                            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/60 p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs">
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

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-zinc-100 dark:border-zinc-800/80 pt-3 text-xs">
                <div className="flex items-center gap-2 font-semibold">
                    <button onClick={() => setActiveTab('matrix')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition cursor-pointer ${activeTab === 'matrix' ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}>
                        <ShieldCheck className="size-4" /> Feature Matrix
                    </button>
                    <button onClick={() => setActiveTab('members')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition cursor-pointer ${activeTab === 'members' ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}>
                        <UserCheck className="size-4" /> Team Member Roles
                    </button>
                </div>

                {hasManageAccess && activeTab === 'matrix' && (
                    <div className="flex items-center gap-1.5">
                        <Sparkles className="size-3.5 text-amber-500" />
                        <span className="text-zinc-400 text-[11px]">Presets:</span>
                        {presets.map((p) => (
                            <button key={p.name} onClick={() => onApplyPreset(p.matrix)} className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-medium text-[11px] text-zinc-700 dark:text-zinc-300 cursor-pointer">
                                {p.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

