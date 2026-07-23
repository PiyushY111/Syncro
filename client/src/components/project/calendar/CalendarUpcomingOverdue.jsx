import { format } from 'date-fns';
import { Clock } from 'lucide-react';

const typeColors = {
    BUG: "bg-red-200 text-red-800 dark:bg-red-500 dark:text-red-900",
    FEATURE: "bg-blue-200 text-blue-800 dark:bg-blue-500 dark:text-blue-900",
    TASK: "bg-green-200 text-green-800 dark:bg-green-500 dark:text-green-900",
    IMPROVEMENT: "bg-purple-200 text-purple-800 dark:bg-purple-500 dark:text-purple-900",
    OTHER: "bg-amber-200 text-amber-800 dark:bg-amber-500 dark:text-amber-900",
};

export default function CalendarUpcomingOverdue({ upcomingTasks, overdueTasks }) {
    return (
        <div className="space-y-6 text-left">
            {/* Upcoming Tasks */}
            <div className="bg-white dark:bg-zinc-950 dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-300 dark:border-zinc-800 rounded-lg p-4">
                <h3 className="text-zinc-900 dark:text-white text-sm flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4" /> Upcoming Tasks
                </h3>
                {upcomingTasks.length === 0 ? (
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm text-center">No upcoming tasks</p>
                ) : (
                    <div className="space-y-2">
                        {upcomingTasks.map((task) => (
                            <div
                                key={task.id}
                                className="bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 p-3 rounded-lg transition"
                            >
                                <div className="flex justify-between items-start text-sm">
                                    <span className="text-zinc-900 dark:text-white truncate pr-2">{task.title}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded flex-shrink-0 ${typeColors[task.type]}`}>
                                        {task.type}
                                    </span>
                                </div>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">{format(new Date(task.due_date), "MMM d")}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Overdue Tasks */}
            {overdueTasks.length > 0 && (
                <div className="bg-white dark:bg-zinc-950 border border-red-300 dark:border-red-500 border-l-4 rounded-lg p-4">
                    <h3 className="text-red-700 dark:text-red-400 text-sm flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4" /> Overdue Tasks ({overdueTasks.length})
                    </h3>
                    <div className="space-y-2">
                        {overdueTasks.slice(0, 5).map((task) => (
                            <div key={task.id} className="bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 p-3 rounded-lg transition" >
                                <div className="flex justify-between text-sm text-zinc-900 dark:text-white">
                                    <span className="truncate pr-2">{task.title}</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-200 dark:bg-red-500 text-red-900 dark:text-red-900 flex-shrink-0">
                                        {task.type}
                                    </span>
                                </div>
                                <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                                    Due {format(new Date(task.due_date), "MMM d")}
                                </p>
                            </div>
                        ))}
                        {overdueTasks.length > 5 && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                                +{overdueTasks.length - 5} more
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
