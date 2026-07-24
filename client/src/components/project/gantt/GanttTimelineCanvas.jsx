import { format, isSameDay } from 'date-fns';
import { Clock, Calendar as CalendarIcon } from 'lucide-react';
import GanttDependencyLayer from './GanttDependencyLayer';
import GanttMilestoneHeader from './components/GanttMilestoneHeader';

const STATUS_COLOR = {
    TODO: { bar: 'from-slate-600 to-slate-700 dark:from-zinc-500 dark:to-zinc-600 border-slate-500', fillPercent: '10%' },
    IN_PROGRESS: { bar: 'from-amber-500 to-amber-600 border-amber-400', fillPercent: '50%' },
    DONE: { bar: 'from-emerald-500 to-emerald-600 border-emerald-400', fillPercent: '100%' }
};

export default function GanttTimelineCanvas({
    chartBodyRef, handleScroll, timelineDays, columnWidth,
    dependencyLines, filteredTasks, criticalPathTaskIds,
    getTaskBarGeometry, handleOpenEdit, onViewInCalendar,
    selectedDate, onSelectDate
}) {
    const milestones = filteredTasks.filter(t => t.type === 'OTHER' || (t.title && t.title.toLowerCase().includes('milestone')));

    return (
        <div ref={chartBodyRef} onScroll={handleScroll} className="flex-1 overflow-x-auto overflow-y-auto relative bg-zinc-50/50 dark:bg-zinc-900/50">
            <div style={{ width: `${timelineDays.length * columnWidth}px` }} className="relative min-h-full">
                <GanttMilestoneHeader timelineDays={timelineDays} columnWidth={columnWidth} milestones={milestones} selectedDate={selectedDate} onSelectDate={onSelectDate} />

                {/* Grid & Selected Date Highlight Beam */}
                <div className="absolute top-13 bottom-0 left-0 right-0 flex pointer-events-none z-0">
                    {timelineDays.map((day, idx) => {
                        const isToday = isSameDay(day, new Date());
                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                        return (
                            <div key={idx} style={{ width: `${columnWidth}px` }} className={`h-full border-r transition-colors ${
                                isSelected
                                    ? 'bg-purple-500/15 border-r-purple-500/80 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                                    : isToday
                                    ? 'bg-blue-500/10 border-r-blue-500/50 shadow-[0_0_8px_rgba(59,130,246,0.15)]'
                                    : isWeekend
                                    ? 'bg-zinc-100/40 dark:bg-zinc-950/30 border-zinc-200/70 dark:border-zinc-850/40'
                                    : 'border-zinc-200/70 dark:border-zinc-850/40'
                            }`} />
                        );
                    })}
                </div>

                <GanttDependencyLayer dependencyLines={dependencyLines} />

                {/* Task Bars */}
                <div className="relative z-10 pt-0">
                    {filteredTasks.map((task) => {
                        const geo = getTaskBarGeometry(task);
                        const isCritical = criticalPathTaskIds.has(task.id);
                        const statusConfig = STATUS_COLOR[task.status] || STATUS_COLOR.TODO;
                        const sDate = task.start_date ? new Date(task.start_date) : new Date(task.createdAt);
                        const dDate = new Date(task.due_date);

                        return (
                            <div key={task.id} className="h-11 flex items-center relative border-b border-zinc-200/60 dark:border-zinc-850/30">
                                <div
                                    onClick={() => handleOpenEdit(task)}
                                    style={{ left: `${geo.left}px`, width: `${Math.max(geo.width, columnWidth)}px` }}
                                    className={`absolute h-7 rounded-md shadow-xs transition-all flex items-center px-2 cursor-pointer group border ${
                                        isCritical ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400 ring-2 ring-amber-400/50' : `bg-gradient-to-r ${statusConfig.bar} text-white border-white/20 hover:brightness-110`
                                    }`}
                                >
                                    <div style={{ width: statusConfig.fillPercent }} className="absolute left-0 top-0 bottom-0 bg-white/25 rounded-md pointer-events-none transition-all duration-300" />
                                    <div className="relative z-10 flex items-center justify-between w-full text-[11px] font-semibold text-white truncate px-1">
                                        <span className="truncate pr-2">{task.title}</span>
                                        <span className="text-[9px] opacity-90 shrink-0 font-mono">{geo.durationDays}d</span>
                                    </div>

                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col gap-1 p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl text-[11px] text-zinc-800 dark:text-zinc-200 z-50 min-w-48">
                                        <div className="font-bold text-zinc-900 dark:text-white">{task.title}</div>
                                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                            <Clock className="size-3 text-blue-500" />
                                            {format(sDate, 'MMM d')} - {format(dDate, 'MMM d, yyyy')} ({geo.durationDays} days)
                                        </div>
                                        <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800 text-[10px]">
                                            <span className="text-zinc-600 dark:text-zinc-400">Progress: <strong className="text-zinc-900 dark:text-white">{statusConfig.fillPercent}</strong></span>
                                            {onViewInCalendar && (
                                                <button type="button" onClick={(e) => { e.stopPropagation(); onViewInCalendar(task); }} className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 hover:underline cursor-pointer">
                                                    <CalendarIcon className="size-3" /> Calendar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
