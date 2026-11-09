import { Sliders, Sparkles } from 'lucide-react';

export default function RolePresetSelector({ onApplyPreset, isOwner }) {
    if (!isOwner) return null;

    const presets = [
        {
            name: 'Strict Enterprise',
            desc: 'Only Admins & Managers create projects & manage team',
            matrix: {
                ADMIN: { createProject: true, editProject: true, deleteProject: true, createTasks: true, editTasks: true, deleteTasks: true, manageMilestones: true, managePortfolios: true, viewAnalytics: true, manageMembers: true },
                MANAGER: { createProject: true, editProject: true, deleteProject: false, createTasks: true, editTasks: true, deleteTasks: true, manageMilestones: true, managePortfolios: true, viewAnalytics: true, manageMembers: false },
                MEMBER: { createProject: false, editProject: false, deleteProject: false, createTasks: true, editTasks: true, deleteTasks: false, manageMilestones: false, managePortfolios: false, viewAnalytics: true, manageMembers: false },
                VIEWER: { createProject: false, editProject: false, deleteProject: false, createTasks: false, editTasks: false, deleteTasks: false, manageMilestones: false, managePortfolios: false, viewAnalytics: true, manageMembers: false }
            }
        },
        {
            name: 'Open Collaborative',
            desc: 'Members can create projects and manage milestones',
            matrix: {
                ADMIN: { createProject: true, editProject: true, deleteProject: true, createTasks: true, editTasks: true, deleteTasks: true, manageMilestones: true, managePortfolios: true, viewAnalytics: true, manageMembers: true },
                MANAGER: { createProject: true, editProject: true, deleteProject: true, createTasks: true, editTasks: true, deleteTasks: true, manageMilestones: true, managePortfolios: true, viewAnalytics: true, manageMembers: true },
                MEMBER: { createProject: true, editProject: true, deleteProject: false, createTasks: true, editTasks: true, deleteTasks: true, manageMilestones: true, managePortfolios: false, viewAnalytics: true, manageMembers: false },
                VIEWER: { createProject: false, editProject: false, deleteProject: false, createTasks: false, editTasks: false, deleteTasks: false, manageMilestones: false, managePortfolios: false, viewAnalytics: true, manageMembers: false }
            }
        }
    ];

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-indigo-500/5 dark:bg-brand/15 p-4 rounded-xl border border-indigo-500/20 text-xs">
            <div className="flex items-center gap-2 text-brand dark:text-violet-300 font-semibold">
                <Sparkles className="size-4" />
                Quick Permission Presets
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                {presets.map((p) => (
                    <button
                        key={p.name}
                        onClick={() => onApplyPreset(p.matrix)}
                        className="px-3 py-1.5 rounded-lg bg-white/70 dark:bg-white/[0.06] border border-slate-900/[0.07] dark:border-white/10 text-zinc-800 dark:text-zinc-200 font-medium hover:border-indigo-500 transition cursor-pointer"
                    >
                        {p.name}
                    </button>
                ))}
            </div>
        </div>
    );
}
