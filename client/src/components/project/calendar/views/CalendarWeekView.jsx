import { format, isSameDay, startOfWeek, addDays, isBefore } from 'date-fns';
import { User, Plus, Bug, Zap, Square, GitCommit, MessageSquare, CheckCircle2 } from 'lucide-react';

const typeIcons = { BUG: Bug, FEATURE: Zap, TASK: Square, IMPROVEMENT: GitCommit, OTHER: MessageSquare };
const priorityBorders = { LOW: "border-l-4 border-l-zinc-400", MEDIUM: "border-l-4 border-l-amber-500", HIGH: "border-l-4 border-l-red-500" };
const priorityBadges = {
    LOW: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    MEDIUM: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
    HIGH: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300",
};

export default function CalendarWeekView({ currentMonth, tasks, selectedDate, setSelectedDate, onTaskClick, onAddTaskForDate, today }) {
    const weekStart = startOfWeek(currentMonth, { weekStartsOn: 0 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const getTasksForDate = (date) => tasks.filter((t) => t.due_date && isSameDay(new Date(t.due_date), date));

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-left">
            {days.map((day) => {
                const dayTasks = getTasksForDate(day);
                const isToday = isSameDay(day, today);
                const isSelected = isSameDay(day, selectedDate);
                const dateStr = format(day, "yyyy-MM-dd");

                return (
                    <div key={day.toISOString()} onClick={() => setSelectedDate(day)}
                        className={`flex flex-col min-h-[360px] rounded-xl border p-3 transition-all ${
                            isSelected ? "border-blue-500 bg-blue-50/40 dark:bg-blue-950/20" : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60"
                        }`}
                    >
                        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 pb-2 mb-3">
                            <div>
                                <p className="text-xs font-semibold text-zinc-500 uppercase">{format(day, "EEE")}</p>
                                <span className={`inline-flex items-center justify-center size-7 text-sm font-bold rounded-full mt-0.5 ${
                                    isToday ? "bg-blue-600 text-white" : "text-zinc-900 dark:text-zinc-100"
                                }`}>{format(day, "d")}</span>
                            </div>
                            <button type="button" onClick={(e) => { e.stopPropagation(); onAddTaskForDate(dateStr); }} title="Add task"
                                className="p-1 rounded text-zinc-500 hover:text-blue-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer">
                                <Plus className="size-4" />
                            </button>
                        </div>
                        <div className="flex-1 space-y-2 overflow-y-auto max-h-[300px]">
                            {dayTasks.length === 0 ? (
                                <p className="text-xs text-zinc-400 text-center py-6">No tasks</p>
                            ) : (
                                dayTasks.map((task) => {
                                    const TypeIcon = typeIcons[task.type] || Square;
                                    const isDone = task.status === "DONE";
                                    const isOverdue = !isDone && isBefore(new Date(task.due_date), today) && !isSameDay(new Date(task.due_date), today);
                                    return (
                                        <div key={task.id} onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
                                            className={`p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer ${
                                                priorityBorders[task.priority] || "border-l-4 border-l-zinc-300"
                                            } ${isOverdue ? "bg-red-50/50 dark:bg-red-950/20" : ""}`}
                                        >
                                            <div className="flex items-center justify-between gap-1 mb-1">
                                                <div className="flex items-center gap-1 min-w-0">
                                                    <TypeIcon className="size-3 text-zinc-500 shrink-0" />
                                                    <span className={`text-xs font-semibold truncate text-zinc-900 dark:text-zinc-100 ${isDone ? "line-through opacity-60" : ""}`}>{task.title}</span>
                                                </div>
                                                {isDone && <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />}
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-2">
                                                <span className={`px-1.5 py-0.5 rounded font-medium ${priorityBadges[task.priority]}`}>{task.priority}</span>
                                                {task.assignee && (
                                                    <span className="flex items-center gap-1 truncate max-w-[80px]">
                                                        {task.assignee.image ? <img src={task.assignee.image} alt="" className="size-3.5 rounded-full object-cover" /> : <User className="size-3" />}
                                                        <span className="truncate">{task.assignee.name?.split(" ")[0]}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
