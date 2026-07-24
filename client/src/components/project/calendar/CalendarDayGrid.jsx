import { format, isSameDay, isSameMonth, isBefore, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { Plus, Bug, Zap, Square, GitCommit, MessageSquare, CheckCircle2 } from 'lucide-react';

const typeIcons = {
    BUG: Bug,
    FEATURE: Zap,
    TASK: Square,
    IMPROVEMENT: GitCommit,
    OTHER: MessageSquare,
};

const priorityBorders = {
    LOW: "border-l-2 border-l-zinc-400 dark:border-l-zinc-500",
    MEDIUM: "border-l-2 border-l-amber-500",
    HIGH: "border-l-2 border-l-red-500",
};

export default function CalendarDayGrid({ currentMonth, selectedDate, setSelectedDate, getTasksForDate, today, onTaskClick, onAddTaskForDate }) {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarDays.map((day) => {
                const dayTasks = getTasksForDate(day);
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, today);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const hasOverdue = dayTasks.some((t) => t.status !== "DONE" && isBefore(new Date(t.due_date), today) && !isSameDay(new Date(t.due_date), today));
                const formattedDateStr = format(day, "yyyy-MM-dd");

                const visibleTasks = dayTasks.slice(0, 2);
                const extraCount = dayTasks.length - visibleTasks.length;

                return (
                    <div
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={`group relative min-h-[90px] sm:min-h-[110px] p-1.5 rounded-lg border transition-all flex flex-col justify-between cursor-pointer text-left ${
                            isSelected
                                ? "bg-blue-50/70 dark:bg-blue-950/30 border-blue-500 dark:border-blue-500 shadow-xs"
                                : isCurrentMonth
                                ? "bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                                : "bg-zinc-50/50 dark:bg-zinc-950/40 border-zinc-100 dark:border-zinc-900 opacity-40 hover:opacity-70"
                        } ${hasOverdue ? "border-red-300 dark:border-red-500/60" : ""}`}
                    >
                        {/* Cell Header: Date Number + Quick Add Button */}
                        <div className="flex items-center justify-between">
                            <span
                                className={`inline-flex items-center justify-center size-6 text-xs font-bold rounded-full ${
                                    isToday
                                        ? "bg-blue-600 text-white shadow-xs"
                                        : isSelected
                                        ? "text-blue-700 dark:text-blue-400 font-extrabold"
                                        : isCurrentMonth
                                        ? "text-zinc-800 dark:text-zinc-200"
                                        : "text-zinc-400 dark:text-zinc-600"
                                }`}
                            >
                                {format(day, "d")}
                            </span>

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAddTaskForDate(formattedDateStr);
                                }}
                                title="Add task on this date"
                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer"
                            >
                                <Plus className="size-3.5" />
                            </button>
                        </div>

                        {/* Task Pills inside Day Cell */}
                        <div className="flex-1 my-1 space-y-1 overflow-hidden">
                            {visibleTasks.map((task) => {
                                const TypeIcon = typeIcons[task.type] || Square;
                                const isDone = task.status === "DONE";

                                return (
                                    <div
                                        key={task.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onTaskClick(task);
                                        }}
                                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer text-zinc-900 dark:text-zinc-100 truncate ${
                                            priorityBorders[task.priority] || ""
                                        }`}
                                        title={`${task.title} (${task.priority})`}
                                    >
                                        <TypeIcon className="size-3 shrink-0 text-zinc-500 dark:text-zinc-400" />
                                        <span className={`truncate ${isDone ? "line-through opacity-60" : ""}`}>
                                            {task.title}
                                        </span>
                                        {isDone && <CheckCircle2 className="size-3 text-emerald-500 shrink-0 ml-auto" />}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer: Extra Tasks Count / Indicator */}
                        {extraCount > 0 && (
                            <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 rounded px-1 py-0.5 text-center">
                                +{extraCount} more
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
