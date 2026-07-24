import { format, isSameDay, isBefore } from 'date-fns';

export default function CalendarDayGrid({ daysInMonth, selectedDate, setSelectedDate, getTasksForDate, today }) {
    return (
        <div className="grid grid-cols-7 gap-2">
            {daysInMonth.map((day) => {
                const dayTasks = getTasksForDate(day);
                const isSelected = isSameDay(day, selectedDate);
                const hasOverdue = dayTasks.some((t) => t.status !== "DONE" && isBefore(new Date(t.due_date), today));

                return (
                    <button
                        key={day}
                        onClick={() => setSelectedDate(day)}
                        className={`sm:h-14 rounded-md flex flex-col items-center justify-center text-sm cursor-pointer ${
                            isSelected ? "bg-blue-200 text-blue-900 dark:bg-blue-600 dark:text-white" : "bg-zinc-50 text-zinc-900 dark:bg-zinc-800/40 dark:text-zinc-300 hover:bg-zinc-100"
                        } ${hasOverdue ? "border border-red-300 dark:border-red-500" : ""}`}
                    >
                        <span>{format(day, "d")}</span>
                        {dayTasks.length > 0 && (
                            <span className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold">{dayTasks.length} tasks</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
