import { Search, Link2, Zap, Calendar as CalendarIcon, Target, Layers, ChevronLeft, ChevronRight, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

export default function GanttHeader({
    currentMonth, zoom, setZoom, searchQuery, setSearchQuery,
    showDependencies, setShowDependencies, highlightCriticalPath, setHighlightCriticalPath,
    groupByStatus, setGroupByStatus, onJumpToToday, onSwitchToCalendar,
    customStartDate, setCustomStartDate, customEndDate, setCustomEndDate,
    handlePrevMonth, handleNextMonth
}) {
    const controlClass = 'flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition';

    return (
        <div className="select-none border-b border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                        <button type="button" onClick={handlePrevMonth} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100" title="Previous month"><ChevronLeft className="size-4" /></button>
                        <span className="min-w-28 px-1 text-center text-xs font-bold text-slate-700">{format(currentMonth, 'MMMM yyyy')}</span>
                        <button type="button" onClick={handleNextMonth} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100" title="Next month"><ChevronRight className="size-4" /></button>
                    </div>
                    <div className="hidden items-center rounded-xl bg-slate-100 p-1 md:flex">
                        {['day', 'week', 'month'].map((mode) => <button key={mode} type="button" onClick={() => setZoom(mode)} className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition ${zoom === mode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>{mode}</button>)}
                    </div>
                    <div className="relative hidden lg:block"><Search className="absolute left-3 top-2 size-3.5 text-slate-400" /><input type="text" placeholder="Search tasks" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-36 rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2 text-xs text-slate-700 outline-none focus:border-indigo-300" /></div>
                    <div className="hidden items-center gap-1 xl:flex"><input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600" /><span className="text-xs text-slate-400">to</span><input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600" /></div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                    <button type="button" onClick={() => setGroupByStatus(!groupByStatus)} className={`${controlClass} ${groupByStatus ? 'border-violet-200 bg-violet-50 text-violet-700' : 'border-slate-200 bg-white text-slate-600'}`}><Layers className="size-3.5" /> Group</button>
                    <button type="button" onClick={onJumpToToday} className={`${controlClass} border-slate-200 bg-white text-slate-600 hover:bg-slate-50`}><Target className="size-3.5 text-blue-500" /> Today</button>
                    {onSwitchToCalendar && <button type="button" onClick={onSwitchToCalendar} className={`${controlClass} border-blue-200 bg-blue-50 text-blue-700`}><CalendarIcon className="size-3.5" /> Calendar</button>}
                    <button type="button" onClick={() => setShowDependencies(!showDependencies)} className={`${controlClass} ${showDependencies ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'}`}><Link2 className="size-3.5" /> Links</button>
                    <button type="button" onClick={() => setHighlightCriticalPath(!highlightCriticalPath)} className={`${controlClass} ${highlightCriticalPath ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-600'}`}><Zap className="size-3.5" /> Critical</button>
                </div>
            </div>
        </div>
    );
}
