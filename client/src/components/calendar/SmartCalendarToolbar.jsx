import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, LayoutGrid, Calendar as CalendarIcon, ListFilter, Plus, RefreshCw, Sparkles, CalendarDays } from 'lucide-react';

export default function SmartCalendarToolbar({
    currentMonth,
    calendarView,
    setCalendarView,
    handlePrev,
    handleNext,
    handleToday,
    onAddMeeting,
    onAddTask,
    onOpenGoogleSync,
    googleSyncEnabled,
    googleSyncEmail,
    isSyncing
}) {
    return (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 text-left">
            {/* Title & Navigation */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <div className="sx-tile sx-tile-emerald">
                        <CalendarIcon className="size-[22px]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Smart Calendar</h1>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Workspace Unified Schedule</p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 ml-2 lg:ml-6 bg-slate-500/[0.08] dark:bg-white/[0.06] p-1 rounded-lg">
                    <button
                        onClick={handlePrev}
                        className="p-1.5 text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-white/[0.07] rounded-md transition cursor-pointer"
                    >
                        <ChevronLeft className="size-4" />
                    </button>
                    <button
                        onClick={handleToday}
                        className="px-3 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-white/[0.07] rounded-md transition cursor-pointer"
                    >
                        Today
                    </button>
                    <button
                        onClick={handleNext}
                        className="p-1.5 text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-white/[0.07] rounded-md transition cursor-pointer"
                    >
                        <ChevronRight className="size-4" />
                    </button>
                </div>

                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 min-w-32 text-center sm:text-left">
                    {calendarView === "agenda" ? "Agenda Timeline" : format(currentMonth, "MMMM yyyy")}
                </span>
            </div>

            {/* View selectors & Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Google Calendar Sync Indicator */}
                <button
                    onClick={onOpenGoogleSync}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                        googleSyncEnabled
                            ? 'bg-amber-50/60 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60 hover:bg-amber-100/60'
                            : 'bg-slate-500/[0.05] dark:bg-white/[0.03] border-slate-900/[0.07] dark:border-white/[0.07] text-zinc-600 dark:text-zinc-400 hover:bg-slate-500/10 dark:hover:bg-white/[0.07]'
                    }`}
                >
                    <Sparkles className={`size-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span className="max-sm:hidden">
                        {googleSyncEnabled ? `Synced: ${googleSyncEmail}` : 'Sync GCal'}
                    </span>
                    <span className="sm:hidden">GCal</span>
                    {googleSyncEnabled && <span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span>}
                </button>

                {/* View selectors */}
                <div className="flex items-center bg-slate-500/[0.08] dark:bg-white/[0.06] p-1 rounded-lg">
                    <button
                        onClick={() => setCalendarView("month")}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                            calendarView === "month"
                                ? "bg-white dark:bg-zinc-700 text-brand dark:text-violet-300 shadow-2xs font-semibold"
                                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                        }`}
                    >
                        <LayoutGrid className="size-3.5" />
                        Month
                    </button>
                    <button
                        onClick={() => setCalendarView("week")}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                            calendarView === "week"
                                ? "bg-white dark:bg-zinc-700 text-brand dark:text-violet-300 shadow-2xs font-semibold"
                                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                        }`}
                    >
                        <CalendarIcon className="size-3.5" />
                        Week
                    </button>
                    <button
                        onClick={() => setCalendarView("day")}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                            calendarView === "day"
                                ? "bg-white dark:bg-zinc-700 text-brand dark:text-violet-300 shadow-2xs font-semibold"
                                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                        }`}
                    >
                        <CalendarDays className="size-3.5" />
                        Day
                    </button>
                    <button
                        onClick={() => setCalendarView("agenda")}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                            calendarView === "agenda"
                                ? "bg-white dark:bg-zinc-700 text-brand dark:text-violet-300 shadow-2xs font-semibold"
                                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                        }`}
                    >
                        <ListFilter className="size-3.5" />
                        Agenda
                    </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={onAddMeeting}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand hover:bg-brand-strong rounded-lg transition shadow-2xs cursor-pointer"
                    >
                        <Plus className="size-3.5" />
                        Meeting
                    </button>
                    <button
                        onClick={onAddTask}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand hover:bg-brand-strong rounded-lg transition shadow-2xs cursor-pointer"
                    >
                        <Plus className="size-3.5" />
                        Task
                    </button>
                </div>
            </div>
        </div>
    );
}
