import { format, isSameDay } from 'date-fns';
import { Clock, Zap } from 'lucide-react';
import GanttDependencyLayer from './GanttDependencyLayer';

const STATUS_COLOR = {
    TODO: { bar: 'from-zinc-500 to-zinc-600' },
    IN_PROGRESS: { bar: 'from-amber-500 to-amber-600' },
    DONE: { bar: 'from-emerald-500 to-emerald-600' }
};

export default function GanttTimelineCanvas({
    chartBodyRef, handleScroll, timelineDays, columnWidth,
    dependencyLines, filteredTasks, criticalPathTaskIds,
    getTaskBarGeometry, handleOpenEdit
}) {
    return (
        <div 
            ref={chartBodyRef}
            onScroll={handleScroll}
            className="flex-1 overflow-x-auto overflow-y-auto relative bg-zinc-900/50"
        >
            <div style={{ width: `${timelineDays.length * columnWidth}px` }} className="relative min-h-full">
                
                {/* Date Header */}
                <div className="sticky top-0 z-20 h-12 bg-zinc-950/90 border-b border-zinc-800 flex flex-col justify-end">
                    <div className="flex h-12 border-t border-zinc-850">
                        {timelineDays.map((day, idx) => {
                            const isToday = isSameDay(day, new Date());
                            const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                            return (
                                <div
                                    key={idx}
                                    style={{ width: `${columnWidth}px` }}
                                    className={`flex flex-col items-center justify-center border-r border-zinc-850/60 text-[10px] select-none ${
                                        isToday ? 'bg-blue-600/20 text-blue-400 font-bold border-r-blue-500/40' : isWeekend ? 'bg-zinc-950/40 text-zinc-600' : 'text-zinc-400'
                                    }`}
                                >
                                    <span className="text-[9px] uppercase font-mono">{format(day, 'EEE')}</span>
                                    <span className="font-semibold">{format(day, 'd')}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Grid Lines */}
                <div className="absolute top-12 bottom-0 left-0 right-0 flex pointer-events-none z-0">
                    {timelineDays.map((day, idx) => {
                        const isToday = isSameDay(day, new Date());
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                        return (
                            <div
                                key={idx}
                                style={{ width: `${columnWidth}px` }}
                                className={`h-full border-r border-zinc-850/40 ${
                                    isToday ? 'bg-blue-500/10 border-r-blue-500/50 shadow-[0_0_8px_rgba(59,130,246,0.2)]' : isWeekend ? 'bg-zinc-950/30' : ''
                                }`}
                            />
                        );
                    })}
                </div>

                {/* SVG Dependency Lines */}
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
                            <div key={task.id} className="h-11 flex items-center relative border-b border-zinc-850/30">
                                <div
                                    onClick={() => handleOpenEdit(task)}
                                    style={{
                                        left: `${geo.left}px`,
                                        width: `${Math.max(geo.width, columnWidth)}px`
                                    }}
                                    className={`absolute h-7 rounded-md shadow-lg transition-all flex items-center px-2 cursor-pointer group border ${
                                        isCritical 
                                            ? 'bg-gradient-to-r from-amber-600 to-amber-700 border-amber-400 ring-2 ring-amber-500/40 shadow-amber-950/40' 
                                            : `bg-gradient-to-r ${statusConfig.bar} border-zinc-700/60 hover:brightness-110`
                                    }`}
                                >
                                    <div 
                                        style={{ width: task.status === 'DONE' ? '100%' : task.status === 'IN_PROGRESS' ? '50%' : '10%' }} 
                                        className="absolute left-0 top-0 bottom-0 bg-white/10 rounded-md pointer-events-none" 
                                    />

                                    <div className="relative z-10 flex items-center justify-between w-full text-[11px] font-semibold text-white truncate px-1">
                                        <span className="truncate pr-2">{task.title}</span>
                                        <span className="text-[9px] opacity-80 shrink-0 font-mono">{geo.durationDays}d</span>
                                    </div>

                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col gap-1 p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl text-[11px] text-zinc-200 z-50 min-w-48 pointer-events-none">
                                        <div className="font-semibold text-white">{task.title}</div>
                                        <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                                            <Clock className="size-3 text-blue-400" />
                                            {format(sDate, 'MMM d')} - {format(dDate, 'MMM d, yyyy')} ({geo.durationDays} days)
                                        </div>
                                        <div className="flex items-center justify-between pt-1 border-t border-zinc-800 text-[10px]">
                                            <span className="text-zinc-400">Status: <strong className="text-white">{task.status}</strong></span>
                                            {isCritical && <span className="text-amber-400 font-bold flex items-center gap-0.5"><Zap className="size-3" /> Critical</span>}
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
