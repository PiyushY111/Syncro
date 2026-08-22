import { useEffect, useState } from 'react';
import { GitCommit, MessageSquare, Clock, Bug, Zap, CheckSquare, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const typeIcons = {
    BUG: { icon: Bug, color: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/40" },
    FEATURE: { icon: Zap, color: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/60 dark:border-blue-900/40" },
    TASK: { icon: CheckSquare, color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/40" },
    IMPROVEMENT: { icon: MessageSquare, color: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/40" },
    OTHER: { icon: GitCommit, color: "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200/60 dark:border-purple-900/40" },
};

const statusBadgeClass = {
    TODO: "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700",
    IN_PROGRESS: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40",
    DONE: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40",
};

const RecentActivity = ({ searchTerm }) => {
    const [tasks, setTasks] = useState([]);
    const { currentWorkspace } = useSelector((state) => state.workspace);

    useEffect(() => {
        if (!currentWorkspace) return;
        let allTasks = (currentWorkspace.projects || []).flatMap((project) => project.tasks || []);

        if (searchTerm?.trim()) {
            const term = searchTerm.toLowerCase().trim();
            allTasks = allTasks.filter(t => 
                t.title?.toLowerCase().includes(term) || 
                (t.description && t.description.toLowerCase().includes(term)) ||
                (t.type && t.type.toLowerCase().includes(term)) ||
                (t.status && t.status.toLowerCase().includes(term)) ||
                (t.assignee?.name && t.assignee.name.toLowerCase().includes(term))
            );
        }

        const sortedTasks = [...allTasks].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        setTasks(sortedTasks.slice(0, 5));
    }, [currentWorkspace, searchTerm]);


    return (
        <Card className="border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-xs rounded-2xl overflow-hidden text-left">
            <CardHeader className="p-5 border-b border-slate-100 dark:border-zinc-800/60 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/40">
                        <Activity className="h-4 w-4" />
                    </div>
                    <div>
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                            Workspace Activity
                        </CardTitle>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                            Real-time task updates and actions
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-6 relative">

                {tasks.length === 0 ? (
                    <div className="py-8 text-center space-y-2">
                        <Clock className="h-8 w-8 mx-auto text-slate-300 dark:text-zinc-600" />
                        <p className="text-xs text-slate-400 dark:text-zinc-500">No recent activity detected in this workspace</p>
                    </div>
                ) : (
                    <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2.5 before:bottom-2.5 before:w-[1px] before:bg-slate-200 dark:before:bg-zinc-800">
                        {tasks.map((task) => {
                            const config = typeIcons[task.type] || typeIcons.OTHER;
                            const TypeIcon = config.icon;
                            const initials = task.assignee?.name ? task.assignee.name.substring(0, 2).toUpperCase() : 'U';

                            return (
                                <div key={task.id} className="relative flex gap-3 pl-8 items-start group">
                                    {/* Icon Indicator */}
                                    <div className={`absolute left-1 top-0.5 p-1 rounded-full border shadow-2xs z-10 transition-transform group-hover:scale-110 ${config.color}`}>
                                        <TypeIcon className="h-3 w-3" />
                                    </div>
                                    
                                    {/* Activity Item Card */}
                                    <div className="flex-1 p-3 rounded-xl border border-slate-200/60 dark:border-zinc-800/60 bg-slate-50/40 dark:bg-zinc-900/40 hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200">
                                        <div className="flex items-start justify-between gap-2 mb-1.5">
                                            <h4 className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {task.title}
                                            </h4>
                                            <Badge variant="outline" className={`text-[9px] py-0 px-1.5 font-medium shrink-0 border ${statusBadgeClass[task.status] || statusBadgeClass.TODO}`}>
                                                {task.status ? task.status.replace("_", " ") : "TODO"}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400">
                                            <Badge variant="outline" className="text-[9px] py-0 px-1.5 capitalize font-normal bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700">
                                                {task.type ? task.type.toLowerCase() : 'task'}
                                            </Badge>
                                            {task.assignee && (
                                                <div className="flex items-center gap-1">
                                                    <Avatar className="h-3.5 w-3.5">
                                                        <AvatarImage src={task.assignee.image} alt={task.assignee.name} />
                                                        <AvatarFallback className="text-[7px] bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold">
                                                            {initials}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-[10px] text-slate-600 dark:text-zinc-400 font-medium">{task.assignee.name}</span>
                                                </div>
                                            )}
                                            <span className="text-[10px] text-slate-400 dark:text-zinc-500 ml-auto font-medium">
                                                {task.updatedAt && !isNaN(new Date(task.updatedAt).getTime())
                                                    ? format(new Date(task.updatedAt), "MMM d, h:mm a")
                                                    : "Recently"}
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

