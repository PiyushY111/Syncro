import { useState } from 'react';
import { format, isSameDay, isBefore, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { CalendarIcon, User, ChevronLeft, ChevronRight } from 'lucide-react';
import CalendarUpcomingOverdue from '@/components/project/calendar/CalendarUpcomingOverdue';
import CalendarDayGrid from './CalendarDayGrid';

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
    const upcomingTasks = tasks.filter((t) => t.due_date && !isBefore(new Date(t.due_date), today) && t.status !== "DONE").sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).slice(0, 5);
    const overdueTasks = tasks.filter((t) => t.due_date && isBefore(new Date(t.due_date), today) && t.status !== "DONE");

    const daysInMonth = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });

    return (
        <div className="grid lg:grid-cols-3 gap-6 text-left">
            <div className="lg:col-span-2">
                <div className="not-dark:bg-white dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-300 dark:border-zinc-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-zinc-900 dark:text-white text-md flex gap-2 items-center max-sm:hidden">
                            <CalendarIcon className="size-5" /> Task Calendar
                        </h2>
                        <div className="flex gap-2 items-center">
                            <button onClick={() => setCurrentMonth(prev => subMonths(prev, 1))} className="cursor-pointer"><ChevronLeft className="size-5 text-zinc-600 dark:text-zinc-400" /></button>
                            <span className="text-zinc-900 dark:text-white font-medium">{format(currentMonth, "MMMM yyyy")}</span>
                            <button onClick={() => setCurrentMonth(prev => addMonths(prev, 1))} className="cursor-pointer"><ChevronRight className="size-5 text-zinc-600 dark:text-zinc-400" /></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 text-xs text-zinc-600 dark:text-zinc-400 mb-2 text-center">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (<div key={day} className="font-semibold">{day}</div>))}
                    </div>
                    <CalendarDayGrid daysInMonth={daysInMonth} selectedDate={selectedDate} setSelectedDate={setSelectedDate} getTasksForDate={getTasksForDate} today={today} />
                </div>

                {getTasksForDate(selectedDate).length > 0 && (
                    <div className="not-dark:bg-white mt-6 dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-300 dark:border-zinc-800 rounded-lg p-4">
                        <h3 className="text-zinc-900 dark:text-white text-base font-semibold mb-3">Tasks for {format(selectedDate, "MMM d, yyyy")}</h3>
                        <div className="space-y-3">
                            {getTasksForDate(selectedDate).map((task) => (
                                <div key={task.id} className={`bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded border-l-4 ${priorityBorders[task.priority]}`}>
                                    <div className="flex justify-between mb-2">
                                        <h4 className="text-zinc-900 dark:text-white font-medium">{task.title}</h4>
                                        <span className={`px-2 py-0.5 rounded text-xs ${typeColors[task.type]}`}>{task.type}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                                        <span className="capitalize">{task.priority.toLowerCase()} priority</span>
                                        {task.assignee && <span className="flex items-center gap-1"><User className="w-3 h-3" />{task.assignee.name}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <CalendarUpcomingOverdue upcomingTasks={upcomingTasks} overdueTasks={overdueTasks} />
        </div>
    );
}
