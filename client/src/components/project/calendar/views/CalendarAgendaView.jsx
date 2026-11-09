import { useMemo } from 'react';
import { format, isBefore, isSameDay } from 'date-fns';
import { CalendarIcon, User, Bug, Zap, Square, GitCommit, MessageSquare, Clock } from 'lucide-react';

const typeIcons = { BUG: Bug, FEATURE: Zap, TASK: Square, IMPROVEMENT: GitCommit, OTHER: MessageSquare };
const priorityBadges = {
    LOW: "bg-slate-500/[0.08] text-zinc-700 dark:bg-white/[0.06] dark:text-zinc-300",
    MEDIUM: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
    HIGH: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300",
};
const statusStyles = {
    TODO: "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200",
    IN_PROGRESS: "bg-brand/10 text-brand dark:bg-brand/15 dark:text-blue-200",
    DONE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200",
};

export default function CalendarAgendaView({ tasks, onTaskClick, today }) {
    const sortedGrouped = useMemo(() => {
        const withDueDate = tasks.filter((t) => t.due_date).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
        const groups = {};
        withDueDate.forEach((t) => {
            const key = format(new Date(t.due_date), "yyyy-MM-dd");
            if (!groups[key]) groups[key] = [];
            groups[key].push(t);
        });
        return groups;
    }, [tasks]);

    const dateKeys = Object.keys(sortedGrouped);
    if (dateKeys.length === 0) {
        return (
            <div className="sx-glass rounded-2xl p-12 text-center text-zinc-500">
                <CalendarIcon className="size-10 mx-auto mb-3 text-zinc-400" />
                <p className="text-base font-semibold text-zinc-800 dark:text-zinc-200">No scheduled tasks found</p>
                <p className="text-xs mt-1">Assign due dates to tasks to view them in the agenda timeline.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 text-left">
            {dateKeys.map((dateStr) => {
                const dateObj = new Date(dateStr);
                const isToday = isSameDay(dateObj, today);
                const isPast = isBefore(dateObj, today) && !isToday;
                const groupTasks = sortedGrouped[dateStr];

                return (
                    <div key={dateStr} className="sx-glass rounded-2xl p-4">
                        <div className="flex items-center justify-between border-b border-slate-900/[0.07] dark:border-white/[0.07] pb-3 mb-3">
                            <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                                    isToday ? "bg-brand text-white" : isPast ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300" : "bg-slate-500/[0.08] text-zinc-800 dark:bg-white/[0.06] dark:text-zinc-200"
                                }`}>{format(dateObj, "EEE, MMM d, yyyy")}</span>
                                {isToday && <span className="text-xs font-semibold text-brand dark:text-violet-300">Today</span>}
                                {isPast && groupTasks.some((t) => t.status !== "DONE") && (
                                    <span className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1"><Clock className="size-3" /> Overdue</span>
                                )}
                            </div>
                            <span className="text-xs text-zinc-500 font-medium">{groupTasks.length} {groupTasks.length === 1 ? "task" : "tasks"}</span>
                        </div>

                        <div className="divide-y divide-slate-900/[0.06] dark:divide-white/[0.06]">
                            {groupTasks.map((task) => {
                                const TypeIcon = typeIcons[task.type] || Square;
                                return (
                                    <div key={task.id} onClick={() => onTaskClick(task)} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-500/[0.06] dark:hover:bg-white/[0.07] px-2 rounded-lg transition cursor-pointer">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="p-2 rounded-lg bg-slate-500/[0.08] dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-300 shrink-0"><TypeIcon className="size-4" /></div>
                                            <div className="min-w-0">
                                                <h4 className={`text-sm font-semibold text-zinc-900 dark:text-white truncate ${task.status === "DONE" ? "line-through opacity-60" : ""}`}>{task.title}</h4>
                                                {task.description && <p className="text-xs text-zinc-500 truncate max-w-md mt-0.5">{task.description}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${statusStyles[task.status] || "bg-zinc-200"}`}>{task.status?.replace(/_/g, " ").toLowerCase()}</span>
                                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${priorityBadges[task.priority]}`}>{task.priority}</span>
                                            {task.assignee && (
                                                <div className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400 bg-slate-500/[0.08] dark:bg-white/[0.06] px-2 py-0.5 rounded-full">
                                                    {task.assignee.image ? <img src={task.assignee.image} alt="" className="size-4 rounded-full object-cover" /> : <User className="size-3" />}
                                                    <span className="truncate max-w-[100px]">{task.assignee.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
