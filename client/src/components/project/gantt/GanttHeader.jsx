import { Search, Link2, Zap, Milestone, Calendar as CalendarIcon, Target, Layers, ChevronLeft, ChevronRight } from 'lucide-react';

export default function GanttHeader({
    zoom, setZoom, searchQuery, setSearchQuery,
    statusFilter, setStatusFilter, showDependencies, setShowDependencies,
    highlightCriticalPath, setHighlightCriticalPath, milestonesOnly, setMilestonesOnly,
    groupByStatus, setGroupByStatus, onJumpToToday, onSwitchToCalendar,
    customStartDate, setCustomStartDate, customEndDate, setCustomEndDate,
    handlePrevMonth, handleNextMonth
}) {
    return (
        <div className="p-3 bg-white/90 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 select-none">
            <div className="flex flex-wrap items-center gap-2">
                {/* Month Shift Navigation */}
                <div className="flex items-center gap-1 border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5 bg-zinc-50 dark:bg-zinc-900">
                    <button type="button" onClick={handlePrevMonth} className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer" title="Previous Month">
                        <ChevronLeft className="size-4" />
                    </button>
                    <span className="text-[11px] font-bold px-1 text-zinc-700 dark:text-zinc-300">Navigate</span>
                    <button type="button" onClick={handleNextMonth} className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer" title="Next Month">
                        <ChevronRight className="size-4" />
                    </button>
                </div>

                {/* Scale buttons */}
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5">
                    {['day', 'week', 'month'].map((mode) => (
                        <button key={mode} type="button" onClick={() => setZoom(mode)} className={`px-2 py-0.5 text-xs capitalize font-semibold rounded transition cursor-pointer ${zoom === mode ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-600 dark:text-zinc-400'}`}>
                            {mode}
                        </button>
                    ))}
                </div>

                {/* Date Range Inputs */}
                <div className="flex items-center gap-1 text-xs">
                    <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-1.5 py-1 text-[11px] font-medium text-zinc-800 dark:text-zinc-200" title="Start Date" />
                    <span className="text-zinc-400 text-[10px]">to</span>
                    <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-1.5 py-1 text-[11px] font-medium text-zinc-800 dark:text-zinc-200" title="End Date" />
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-2 top-2 size-3.5 text-zinc-400" />
                    <input type="text" placeholder="Filter..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs rounded-lg pl-7 pr-2 py-1 text-zinc-800 dark:text-zinc-200 focus:outline-none w-28 md:w-36" />
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
                <button type="button" onClick={() => setGroupByStatus(!groupByStatus)} className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded border transition cursor-pointer ${groupByStatus ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-300 text-emerald-700 dark:text-emerald-400' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'}`} title="Group Status">
                    <Layers className="size-3.5" /> Grouping
                </button>

                <button type="button" onClick={onJumpToToday} className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 transition cursor-pointer" title="Today">
                    <Target className="size-3.5 text-blue-500" /> Today
                </button>

                {onSwitchToCalendar && (
                    <button type="button" onClick={onSwitchToCalendar} className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition cursor-pointer">
                        <CalendarIcon className="size-3.5" /> Calendar
                    </button>
                )}

                <button type="button" onClick={() => setShowDependencies(!showDependencies)} className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded border transition cursor-pointer ${showDependencies ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-300 text-blue-600 dark:text-blue-400' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                    <Link2 className="size-3.5" /> Deps
                </button>

                <button type="button" onClick={() => setHighlightCriticalPath(!highlightCriticalPath)} className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded border transition cursor-pointer ${highlightCriticalPath ? 'bg-amber-50 dark:bg-amber-500/20 border-amber-300 text-amber-700 dark:text-amber-400' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                    <Zap className="size-3.5" /> Critical
                </button>
            </div>
        </div>
    );
}
