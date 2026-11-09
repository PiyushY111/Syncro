import { format } from 'date-fns';
import { Plus, CheckCircle2, User, Workflow } from 'lucide-react';

const typeColors = {
    BUG: "bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-900",
    FEATURE: "bg-brand/10 text-brand dark:bg-brand/15 dark:text-violet-300 border border-brand/25 dark:border-brand/30",
    TASK: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900",
    IMPROVEMENT: "bg-brand/10 text-brand dark:bg-brand/15 dark:text-violet-300 border border-brand/25 dark:border-brand/30",
    OTHER: "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-900",
};

const priorityBorders = {
    LOW: "border-l-4 border-l-zinc-400 dark:border-l-zinc-500",
    MEDIUM: "border-l-4 border-l-amber-500",
    HIGH: "border-l-4 border-l-red-500",
};

export default function CalendarSelectedDayTasks({ selectedDate, selectedDayTasks, handleAddTaskForDate, handleTaskClick, onViewInGantt }) {
    return (
        <div className="sx-glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-zinc-900 dark:text-white font-bold text-base">Tasks for {format(selectedDate, "MMMM d, yyyy")}</h3>
                <button type="button" onClick={() => handleAddTaskForDate(format(selectedDate, "yyyy-MM-dd"))} className="flex items-center gap-1 text-xs font-semibold text-brand dark:text-violet-300 hover:underline cursor-pointer">
                    <Plus className="size-3.5" /> Add Task
                </button>
            </div>
            {selectedDayTasks.length === 0 ? (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-6">No tasks scheduled for this date.</p>
            ) : (
                <div className="space-y-2.5">
                    {selectedDayTasks.map((task) => (
                        <div key={task.id} onClick={() => handleTaskClick(task)} className={`bg-slate-500/[0.05] dark:bg-white/[0.06] hover:bg-slate-500/10 dark:hover:bg-white/[0.07] p-3.5 rounded-lg border-l-4 transition cursor-pointer flex items-center justify-between gap-3 ${priorityBorders[task.priority] || "border-l-zinc-300"}`}>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className={`text-sm font-semibold text-zinc-900 dark:text-white truncate ${task.status === "DONE" ? "line-through opacity-60" : ""}`}>{task.title}</h4>
                                    {task.status === "DONE" && <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                                    <span className="capitalize">{task.priority.toLowerCase()} priority</span>
                                    {task.assignee && <span className="flex items-center gap-1"><User className="size-3" />{task.assignee.name}</span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className={`px-2.5 py-1 rounded text-xs font-bold ${typeColors[task.type]}`}>{task.type}</span>
                                {onViewInGantt && (
                                    <button type="button" onClick={(e) => { e.stopPropagation(); onViewInGantt(task); }} title="View in Gantt Chart" className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-white/[0.07] text-brand dark:text-violet-300 transition cursor-pointer">
                                        <Workflow className="size-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
