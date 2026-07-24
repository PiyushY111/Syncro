import { format } from 'date-fns';
import { Clock, AlertTriangle } from 'lucide-react';

const typeColors = {
    BUG: "bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-900",
    FEATURE: "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-900",
    TASK: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900",
    IMPROVEMENT: "bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-900",
    OTHER: "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-900",
};

export default function CalendarUpcomingOverdue({ upcomingTasks, overdueTasks, onTaskClick }) {
    return (
        <div className="space-y-6 text-left">
            {/* Upcoming Tasks */}
            <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
                <h3 className="text-zinc-900 dark:text-white font-semibold text-sm flex items-center gap-2 mb-3">
                    <Clock className="size-4 text-blue-500" /> Upcoming Tasks
                </h3>
                {upcomingTasks.length === 0 ? (
                    <p className="text-zinc-400 dark:text-zinc-500 text-xs text-center py-4">No upcoming tasks</p>
                ) : (
                    <div className="space-y-2">
                        {upcomingTasks.map((task) => (
                            <div
                                key={task.id}
                                onClick={() => onTaskClick && onTaskClick(task)}
                                className="bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 p-3 rounded-lg transition cursor-pointer border border-zinc-200/60 dark:border-zinc-800"
                            >
                                <div className="flex justify-between items-start text-sm">
                                    <span className="text-zinc-900 dark:text-white font-medium truncate pr-2">{task.title}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0 ${typeColors[task.type]}`}>
                                        {task.type}
                                    </span>
                                </div>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                                    <span>Due {format(new Date(task.due_date), "MMM d, yyyy")}</span>
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Overdue Tasks */}
            {overdueTasks.length > 0 && (
                <div className="bg-white dark:bg-zinc-900/60 border border-red-300 dark:border-red-900/60 border-l-4 border-l-red-500 rounded-xl p-4 shadow-xs">
                    <h3 className="text-red-600 dark:text-red-400 font-semibold text-sm flex items-center gap-2 mb-3">
                        <AlertTriangle className="size-4 text-red-500" /> Overdue Tasks ({overdueTasks.length})
                    </h3>
                    <div className="space-y-2">
                        {overdueTasks.slice(0, 5).map((task) => (
                            <div
                                key={task.id}
                                onClick={() => onTaskClick && onTaskClick(task)}
                                className="bg-red-50/60 dark:bg-red-950/20 hover:bg-red-100/80 dark:hover:bg-red-950/40 p-3 rounded-lg transition cursor-pointer border border-red-200/50 dark:border-red-900/40"
                            >
                                <div className="flex justify-between text-sm text-zinc-900 dark:text-white">
                                    <span className="font-medium truncate pr-2">{task.title}</span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-200 flex-shrink-0">
                                        {task.type}
                                    </span>
                                </div>
                                <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-1">
                                    Due {format(new Date(task.due_date), "MMM d")}
                                </p>
                            </div>
                        ))}
                        {overdueTasks.length > 5 && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center pt-1 font-medium">
                                +{overdueTasks.length - 5} more overdue tasks
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
