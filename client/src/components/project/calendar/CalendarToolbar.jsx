import { format } from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight, LayoutGrid, Calendar as CalendarViewIcon, ListFilter, Plus } from 'lucide-react';

export default function CalendarToolbar({ currentMonth, calendarView, setCalendarView, handlePrev, handleNext, handleToday, onAddTaskForDate, selectedDate, filteredCount }) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand-tint dark:bg-brand/15 text-brand dark:text-violet-300">
                    <CalendarIcon className="size-5" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        {calendarView === "agenda" ? "Task Timeline Agenda" : format(currentMonth, "MMMM yyyy")}
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{filteredCount} scheduled {filteredCount === 1 ? "task" : "tasks"}</p>
                </div>
                {calendarView !== "agenda" && (
                    <div className="flex items-center gap-1 ml-2">
                        <button type="button" onClick={handlePrev} className="p-1.5 rounded-lg border border-slate-900/[0.07] dark:border-white/[0.07] hover:bg-slate-500/10 dark:hover:bg-white/[0.07] text-zinc-600 dark:text-zinc-300 transition cursor-pointer" title="Previous"><ChevronLeft className="size-4" /></button>
                        <button type="button" onClick={handleToday} className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-900/[0.07] dark:border-white/[0.07] hover:bg-slate-500/10 dark:hover:bg-white/[0.07] text-zinc-700 dark:text-zinc-300 transition cursor-pointer">Today</button>
                        <button type="button" onClick={handleNext} className="p-1.5 rounded-lg border border-slate-900/[0.07] dark:border-white/[0.07] hover:bg-slate-500/10 dark:hover:bg-white/[0.07] text-zinc-600 dark:text-zinc-300 transition cursor-pointer" title="Next"><ChevronRight className="size-4" /></button>
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex p-1 rounded-lg border border-slate-900/[0.07] dark:border-white/[0.07] bg-slate-500/[0.05] dark:bg-white/[0.02]">
                    <button type="button" onClick={() => setCalendarView("month")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${calendarView === "month" ? "bg-white/60 dark:bg-white/[0.06] text-brand dark:text-violet-300" : "text-zinc-500"}`}><LayoutGrid className="size-3.5" />Month</button>
                    <button type="button" onClick={() => setCalendarView("week")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${calendarView === "week" ? "bg-white/60 dark:bg-white/[0.06] text-brand dark:text-violet-300" : "text-zinc-500"}`}><CalendarViewIcon className="size-3.5" />Week</button>
                    <button type="button" onClick={() => setCalendarView("agenda")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${calendarView === "agenda" ? "bg-white/60 dark:bg-white/[0.06] text-brand dark:text-violet-300" : "text-zinc-500"}`}><ListFilter className="size-3.5" />Agenda</button>
                </div>
                <button type="button" onClick={() => onAddTaskForDate(format(selectedDate, "yyyy-MM-dd"))} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-br from-[#7c5cff] to-brand text-white shadow-2xs hover:from-[#8b6dff] hover:to-brand-strong transition cursor-pointer"><Plus className="size-4" />New Task</button>
            </div>
        </div>
    );
}
