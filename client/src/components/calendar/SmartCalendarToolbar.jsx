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
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg">
                        <CalendarIcon className="size-5" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Smart Calendar</h1>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Workspace Unified Schedule</p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 ml-2 lg:ml-6 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                    <button
                        onClick={handlePrev}
                        className="p-1.5 text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition cursor-pointer"
                    >
                        <ChevronLeft className="size-4" />
                    </button>
                    <button
                        onClick={handleToday}
                        className="px-3 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition cursor-pointer"
                    >
                        Today
                    </button>
                    <button
                        onClick={handleNext}
                        className="p-1.5 text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition cursor-pointer"
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
                            : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
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
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-lg">
                    <button
                        onClick={() => setCalendarView("month")}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                            calendarView === "month"
                                ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold"
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
                                ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold"
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
                                ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold"
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
                                ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold"
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
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition shadow-2xs cursor-pointer"
                    >
                        <Plus className="size-3.5" />
                        Meeting
                    </button>
                    <button
                        onClick={onAddTask}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-2xs cursor-pointer"
                    >
                        <Plus className="size-3.5" />
                        Task
                    </button>
                </div>
            </div>
        </div>
    );
}
