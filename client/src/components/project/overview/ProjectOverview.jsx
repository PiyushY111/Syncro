import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, UsersIcon, FolderOpen } from 'lucide-react';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';
import CreateProjectDialog from '@/components/project/dialogs/CreateProjectDialog';
import { useAuth } from '@/context/AuthContext';

const ProjectOverview = ({ activeFilter, searchTerm }) => {
    const statusColors = {
        PLANNING: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300",
        ACTIVE: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
        ON_HOLD: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
        COMPLETED: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
        CANCELLED: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
    };

    const priorityGlow = {
        LOW: "bg-zinc-400 shadow-[0_0_8px_rgba(161,161,170,0.5)]",
        MEDIUM: "bg-amber-550 shadow-[0_0_8px_rgba(245,158,11,0.5)]",
        HIGH: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
    };

    const currentWorkspace = useSelector((state) => state?.workspace?.currentWorkspace || null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [projects, setProjects] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        let list = currentWorkspace?.projects || [];
        if (activeFilter === "completed") list = list.filter(p => p.status === "COMPLETED");
        else if (activeFilter === "mytasks") list = list.filter(p => p.tasks.some(t => t.assigneeId === user?.id || t.assignee?.email === user?.email));
        else if (activeFilter === "overdue") list = list.filter(p => p.tasks.some(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "DONE"));

        if (searchTerm?.trim()) {
            const term = searchTerm.toLowerCase().trim();
            list = list.filter(p => p.name.toLowerCase().includes(term) || (p.description && p.description.toLowerCase().includes(term)));
        }
        setProjects(list);
    }, [currentWorkspace, activeFilter, searchTerm, user]);

    return currentWorkspace && (
        <div className="bg-white dark:bg-zinc-950 dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 rounded-2xl overflow-hidden shadow-xs text-left">
            <div className="border-b border-zinc-200 dark:border-zinc-800 p-5 flex items-center justify-between">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-300 uppercase tracking-wider">Project Overview</h2>
                <Link to={'/projects'} className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-450 flex items-center gap-1">
                    View all <ArrowRight className="size-3.5" />
                </Link>
            </div>

            <div className="p-5">
                {projects.length === 0 ? (
                    <div className="py-12 text-center">
                        <FolderOpen className="size-10 mx-auto text-zinc-400 mb-3" />
                        <p className="text-sm text-zinc-500">No matching projects found</p>
                        <button onClick={() => setIsDialogOpen(true)} className="mt-4 px-4 py-2 text-xs bg-blue-600 text-white rounded-lg hover:opacity-90 transition font-bold cursor-pointer">Create Project</button>
                        <CreateProjectDialog isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-stiff-pop">
                        {projects.slice(0, 4).map((project) => (
                            <Link key={project.id} to={`/projectsDetail?id=${project.id}&tab=tasks`} className="p-5 bg-zinc-50/40 dark:bg-zinc-900/10 border border-zinc-100 dark:border-zinc-850 hover:border-zinc-200 dark:hover:border-zinc-800 rounded-xl hover:scale-[1.01] hover:shadow-xs transition-all duration-300 flex flex-col justify-between min-h-[160px]">
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${statusColors[project.status]}`}>
                                            {project.status.replace('_', ' ')}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] text-zinc-400 font-bold uppercase">{project.priority}</span>
                                            <div className={`w-1.5 h-1.5 rounded-full ${priorityGlow[project.priority]}`} />
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-zinc-900 dark:text-white text-sm line-clamp-1 mb-1">{project.name}</h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-4">{project.description || 'No description provided.'}</p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1"><UsersIcon className="size-3" /> {project.members?.length || 0}</span>
                                            {project.end_date && (
                                                <span className="flex items-center gap-1"><Calendar className="size-3" /> {format(new Date(project.end_date), "MMM d")}</span>
                                            )}
                                        </div>
                                        <span className="font-semibold text-zinc-700 dark:text-zinc-350">{project.progress || 0}%</span>
                                    </div>
                                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${project.progress || 0}%` }} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectOverview;
