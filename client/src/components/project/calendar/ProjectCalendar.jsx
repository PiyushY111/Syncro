import { useState } from 'react';
import { format, isSameDay, isBefore, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { CalendarIcon, User, ChevronLeft, ChevronRight } from 'lucide-react';
import CalendarUpcomingOverdue from '@/components/project/calendar/CalendarUpcomingOverdue';

const typeColors = {
    BUG: "bg-red-200 text-red-800 dark:bg-red-500 dark:text-red-900",
    FEATURE: "bg-blue-200 text-blue-800 dark:bg-blue-500 dark:text-blue-900",
    TASK: "bg-green-200 text-green-800 dark:bg-green-500 dark:text-green-900",
    IMPROVEMENT: "bg-purple-200 text-purple-800 dark:bg-purple-500 dark:text-purple-900",
    OTHER: "bg-amber-200 text-amber-800 dark:bg-amber-500 dark:text-amber-900",
};

const priorityBorders = {
    LOW: "border-zinc-300 dark:border-zinc-600",
    MEDIUM: "border-amber-300 dark:border-amber-500",
    HIGH: "border-orange-300 dark:border-orange-500",
};

export default function ProjectCalendar({ tasks }) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const today = new Date();
    const getTasksForDate = (date) => tasks.filter((task) => isSameDay(new Date(task.due_date), date));

    const upcomingTasks = tasks
        .filter((task) => task.due_date && !isBefore(new Date(task.due_date), today) && task.status !== "DONE")
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .slice(0, 5);

    const overdueTasks = tasks.filter((task) => task.due_date && isBefore(new Date(task.due_date), today) && task.status !== "DONE");

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    });

    const handleMonthChange = (direction) => {
        setCurrentMonth((prev) => (direction === "next" ? addMonths(prev, 1) : subMonths(prev, 1)));
    };

    return (
        <div className="grid lg:grid-cols-3 gap-6 text-left">
            {/* Calendar View */}
            <div className="lg:col-span-2">
                <div className="not-dark:bg-white dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-300 dark:border-zinc-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-zinc-900 dark:text-white text-md flex gap-2 items-center max-sm:hidden">
                            <CalendarIcon className="size-5" /> Task Calendar
                        </h2>
                        <div className="flex gap-2 items-center">
                            <button onClick={() => handleMonthChange("prev")} className="cursor-pointer">
                                <ChevronLeft className="size-5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white" />
                            </button>
                            <span className="text-zinc-900 dark:text-white font-medium">{format(currentMonth, "MMMM yyyy")}</span>
                            <button onClick={() => handleMonthChange("next")} className="cursor-pointer">
                                <ChevronRight className="size-5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 text-xs text-zinc-600 dark:text-zinc-400 mb-2 text-center">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                            <div key={day} className="font-semibold">{day}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {daysInMonth.map((day) => {
                            const dayTasks = getTasksForDate(day);
                            const isSelected = isSameDay(day, selectedDate);
                            const hasOverdue = dayTasks.some((t) => t.status !== "DONE" && isBefore(new Date(t.due_date), today));

                            return (
                                <button
                                    key={day}
                                    onClick={() => setSelectedDate(day)}
                                    className={`sm:h-14 rounded-md flex flex-col items-center justify-center text-sm cursor-pointer
                                    ${isSelected ? "bg-blue-200 text-blue-900 dark:bg-blue-600 dark:text-white" : "bg-zinc-50 text-zinc-900 dark:bg-zinc-800/40 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"}
                                    ${hasOverdue ? "border border-red-300 dark:border-red-500" : ""}`}
                                >
                                    <span>{format(day, "d")}</span>
                                    {dayTasks.length > 0 && (
                                        <span className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold">{dayTasks.length} tasks</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tasks for Selected Day */}
                {getTasksForDate(selectedDate).length > 0 && (
                    <div className="not-dark:bg-white mt-6 dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-300 dark:border-zinc-800 rounded-lg p-4">
                        <h3 className="text-zinc-900 dark:text-white text-base font-semibold mb-3">
                            Tasks for {format(selectedDate, "MMM d, yyyy")}
                        </h3>
                        <div className="space-y-3">
                            {getTasksForDate(selectedDate).map((task) => (
                                <div
                                    key={task.id}
                                    className={`bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition p-4 rounded border-l-4 ${priorityBorders[task.priority]}`}
                                >
                                    <div className="flex justify-between mb-2">
                                        <h4 className="text-zinc-900 dark:text-white font-medium">{task.title}</h4>
                                        <span className={`px-2 py-0.5 rounded text-xs ${typeColors[task.type]}`}>
                                            {task.type}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                                        <span className="capitalize">{task.priority.toLowerCase()} priority</span>
                                        {task.assignee && (
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {task.assignee.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Sidebar */}
            <CalendarUpcomingOverdue
                upcomingTasks={upcomingTasks}
                overdueTasks={overdueTasks}
            />
        </div>
    );
}
