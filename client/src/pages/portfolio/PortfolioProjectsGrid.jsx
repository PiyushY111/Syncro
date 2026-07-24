import { Trash2, ArrowRight, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PortfolioProjectsGrid({ projects, onRemoveProject, onOpenAddModal }) {
    const navigate = useNavigate();

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">Portfolio Projects</h3>
                <button
                    onClick={onOpenAddModal}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                    + Add Projects
                </button>
            </div>

            {!projects || projects.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                    <p className="text-xs text-zinc-500">No projects added to this portfolio yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map(({ project }) => {
                        if (!project) return null;
                        const tasks = project.tasks || [];
                        const completed = tasks.filter(t => t.status === "DONE").length;
                        const prog = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : (project.progress || 0);

                        return (
                            <div key={project.id} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 flex flex-col justify-between space-y-3">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm truncate">{project.name}</h4>
                                        <button onClick={() => onRemoveProject(project.id)} className="text-zinc-400 hover:text-rose-500 p-1 cursor-pointer">
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    </div>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-1">{project.description || 'No description'}</p>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                                    <div className="flex items-center justify-between text-xs text-zinc-500">
                                        <span className="flex items-center gap-1">
                                            <User className="size-3 text-zinc-400" />
                                            {project.owner?.name || 'Unassigned'}
                                        </span>
                                        <span className="font-medium text-zinc-700 dark:text-zinc-300">{prog}%</span>
                                    </div>
                                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${prog}%` }} />
                                    </div>
                                    <button
                                        onClick={() => navigate(`/projectsDetail?id=${project.id}`)}
                                        className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                                    >
                                        Open Project <ArrowRight className="size-3" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
