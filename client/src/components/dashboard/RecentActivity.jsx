import { useEffect, useState } from 'react';
import { GitCommit, MessageSquare, Clock, Bug, Zap, Square } from 'lucide-react';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const typeIcons = {
    BUG: { icon: Bug, color: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/40" },
    FEATURE: { icon: Zap, color: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-900/40" },
    TASK: { icon: Square, color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40" },
    IMPROVEMENT: { icon: MessageSquare, color: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/40" },
    OTHER: { icon: GitCommit, color: "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-900/40" },
};

const statusBadgeVariant = {
    TODO: "secondary",
    IN_PROGRESS: "warning",
    DONE: "success",
};

const RecentActivity = () => {
    const [tasks, setTasks] = useState([]);
    const { currentWorkspace } = useSelector((state) => state.workspace);

    useEffect(() => {
        if (!currentWorkspace) return;
        const allTasks = (currentWorkspace.projects || []).flatMap((project) => project.tasks || []);
        const sortedTasks = [...allTasks].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        setTasks(sortedTasks.slice(0, 5));
    }, [currentWorkspace]);

    return (
        <Card>
            <CardHeader className="border-b border-slate-100 dark:border-zinc-800/80 p-5">
                <CardTitle className="text-sm uppercase tracking-wider font-semibold text-slate-500 dark:text-zinc-400">
                    Recent Workspace Activity
                </CardTitle>
            </CardHeader>

            <CardContent className="p-6 relative">
                {tasks.length === 0 ? (
                    <div className="py-10 text-center">
                        <Clock className="h-10 w-10 mx-auto text-slate-300 dark:text-zinc-600 mb-2" />
                        <p className="text-xs text-slate-500 dark:text-zinc-400">No recent activity detected in this workspace</p>
                    </div>
                ) : (
                    <div className="space-y-5 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-zinc-800">
                        {tasks.map((task) => {
                            const config = typeIcons[task.type] || typeIcons.OTHER;
                            const TypeIcon = config.icon;
                            const initials = task.assignee?.name ? task.assignee.name.substring(0, 2).toUpperCase() : 'U';

                            return (
                                <div key={task.id} className="relative flex gap-4 pl-9 items-start group">
                                    {/* Icon Indicator */}
                                    <div className={`absolute left-1.5 top-0.5 p-1 rounded-full border shadow-2xs z-10 transition-transform group-hover:scale-110 ${config.color}`}>
                                        <TypeIcon className="h-3.5 w-3.5" />
                                    </div>
                                    
                                    {/* Card */}
                                    <div className="flex-1 p-3.5 rounded-xl border border-slate-200/60 dark:border-zinc-800/60 bg-slate-50/40 dark:bg-zinc-900/40 hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200">
                                        <div className="flex items-start justify-between gap-3 mb-1.5">
                                            <h4 className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                                                {task.title}
                                            </h4>
                                            <Badge variant={statusBadgeVariant[task.status] || "secondary"} className="text-[10px] py-0 px-2 font-medium shrink-0">
                                                {task.status ? task.status.replace("_", " ") : "TODO"}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-500 dark:text-zinc-400">
                                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 capitalize font-normal">
                                                {task.type.toLowerCase()}
                                            </Badge>
                                            {task.assignee && (
                                                <div className="flex items-center gap-1.5">
                                                    <Avatar className="h-4 w-4">
                                                        <AvatarImage src={task.assignee.image} alt={task.assignee.name} />
                                                        <AvatarFallback className="text-[8px] bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold">
                                                            {initials}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-[11px]">{task.assignee.name}</span>
                                                </div>
                                            )}
                                            <span className="text-[10px] text-slate-400 dark:text-zinc-500 ml-auto">
                                                {format(new Date(task.updatedAt), "MMM d, h:mm a")}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default RecentActivity;
