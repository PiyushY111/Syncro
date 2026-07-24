import { useEffect, useState } from 'react';
import { GitCommit, MessageSquare, Clock, Bug, Zap, Square } from 'lucide-react';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';

const typeIcons = {
    BUG: { icon: Bug, color: "bg-rose-50 text-rose-500 dark:bg-rose-950/20 dark:text-rose-400 border-rose-200/50" },
    FEATURE: { icon: Zap, color: "bg-blue-50 text-blue-500 dark:bg-blue-950/20 dark:text-blue-400 border-blue-200/50" },
    TASK: { icon: Square, color: "bg-emerald-50 text-emerald-500 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200/50" },
    IMPROVEMENT: { icon: MessageSquare, color: "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200/50" },
    OTHER: { icon: GitCommit, color: "bg-purple-50 text-purple-500 dark:bg-purple-950/20 dark:text-purple-400 border-purple-200/50" },
};

const statusColors = {
    TODO: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    IN_PROGRESS: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
    DONE: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
};

const RecentActivity = () => {
    const [tasks, setTasks] = useState([]);
    const { currentWorkspace } = useSelector((state) => state.workspace);

    useEffect(() => {
        if (!currentWorkspace) return;
        const allTasks = currentWorkspace.projects.flatMap((project) => project.tasks);
        const sortedTasks = [...allTasks].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        setTasks(sortedTasks.slice(0, 5));
    }, [currentWorkspace]);

    return (
        <div className="bg-white dark:bg-zinc-950 dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-2xl overflow-hidden shadow-xs text-left">
            <div className="border-b border-zinc-200 dark:border-zinc-800 p-5">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-300 uppercase tracking-wider">Recent Activity</h2>
            </div>

            <div className="p-6 relative">
                {tasks.length === 0 ? (
                    <div className="py-12 text-center">
                        <Clock className="size-10 mx-auto text-zinc-400 mb-3" />
                        <p className="text-sm text-zinc-500">No recent activity</p>
                    </div>
                ) : (
                    <div className="space-y-6 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-[2px] before:bg-zinc-100 dark:before:bg-zinc-850">
                        {tasks.map((task) => {
                            const config = typeIcons[task.type] || typeIcons.OTHER;
                            const TypeIcon = config.icon;

                            return (
                                <div key={task.id} className="relative flex gap-5 pl-10 items-start group">
                                    {/* Icon Indicator on Timeline */}
                                    <div className={`absolute left-2 top-0.5 p-1.5 rounded-full border shadow-xs z-10 transition-transform group-hover:scale-110 duration-300 ${config.color}`}>
                                        <TypeIcon className="size-3.5" />
                                    </div>
                                    
                                    {/* Activity Card */}
                                    <div className="flex-1 p-4 rounded-xl border border-zinc-100 dark:border-zinc-850 bg-zinc-50/30 dark:bg-zinc-900/10 hover:border-zinc-200 dark:hover:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-all duration-300">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">
                                                {task.title}
                                            </h4>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${statusColors[task.status] || "bg-zinc-300 text-zinc-700"}`}>
                                                {task.status.replace("_", " ")}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                                            <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-650 dark:text-zinc-400 capitalize">{task.type.toLowerCase()}</span>
                                            {task.assignee && (
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-4 h-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200/30 rounded-full flex items-center justify-center text-[9px] font-extrabold uppercase">
                                                        {task.assignee.name[0]}
                                                    </div>
                                                    <span>{task.assignee.name}</span>
                                                </div>
                                            )}
                                            <span className="text-[10px] text-zinc-400">{format(new Date(task.updatedAt), "MMM d, h:mm a")}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecentActivity;
