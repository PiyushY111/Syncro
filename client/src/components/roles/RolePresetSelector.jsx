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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-indigo-500/5 dark:bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20 text-xs">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold">
                <Sparkles className="size-4" />
                Quick Permission Presets
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                {presets.map((p) => (
                    <button
                        key={p.name}
                        onClick={() => onApplyPreset(p.matrix)}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium hover:border-indigo-500 transition cursor-pointer"
                    >
                        {p.name}
                    </button>
                ))}
            </div>
        </div>
    );
}
