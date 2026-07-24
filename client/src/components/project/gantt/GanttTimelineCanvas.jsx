import { format, isSameDay } from 'date-fns';
import { Clock, Calendar as CalendarIcon } from 'lucide-react';
import GanttDependencyLayer from './GanttDependencyLayer';
import GanttMilestoneHeader from './components/GanttMilestoneHeader';

const STATUS_COLOR = {
    TODO: { bar: 'bg-violet-400', fill: 'bg-violet-500', percent: '10%' },
    IN_PROGRESS: { bar: 'bg-amber-300', fill: 'bg-amber-400', percent: '50%' },
    DONE: { bar: 'bg-emerald-300', fill: 'bg-emerald-400', percent: '100%' }
};

export default function GanttTimelineCanvas({ chartBodyRef, handleScroll, timelineDays, columnWidth, dependencyLines, filteredTasks, criticalPathTaskIds, getTaskBarGeometry, handleOpenEdit, onViewInCalendar, selectedDate, onSelectDate, groupByStatus, expandedGroups }) {
    const milestones = filteredTasks.filter((task) => task.type === 'OTHER' || task.title?.toLowerCase().includes('milestone'));
    const statusGroups = ['IN_PROGRESS', 'TODO', 'DONE'].map((status) => ({ status, tasks: filteredTasks.filter((task) => task.status === status) })).filter((group) => group.tasks.length);
    const selectedIndex = timelineDays.findIndex((day) => selectedDate && isSameDay(day, selectedDate));

    const taskBar = (task) => {
        const geometry = getTaskBarGeometry(task);
        const isCritical = criticalPathTaskIds.has(task.id);
        const color = STATUS_COLOR[task.status] || STATUS_COLOR.TODO;
        const start = task.start_date ? new Date(task.start_date) : new Date(task.createdAt);
        const due = new Date(task.due_date);
        return <div key={task.id} className="relative flex h-12 items-center border-b border-slate-100">
            <button type="button" onClick={() => handleOpenEdit(task)} style={{ left: `${geometry.left}px`, width: `${Math.max(geometry.width, columnWidth)}px` }} className={`group absolute flex h-8 items-center overflow-hidden rounded-full px-3 text-left shadow-sm transition hover:-translate-y-px hover:shadow-md ${isCritical ? 'bg-rose-400 ring-2 ring-rose-200' : color.bar}`}>
                <span style={{ width: color.percent }} className={`absolute inset-y-0 left-0 opacity-55 ${color.fill}`} />
                <span className="relative z-10 flex w-full items-center justify-between gap-3 truncate text-xs font-semibold text-slate-700"><span className="truncate">{task.title}</span><span className="text-[10px] text-slate-600/80">{geometry.durationDays}d</span></span>
                <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-3 hidden w-56 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-xl group-hover:block"><span className="block text-xs font-bold text-slate-800">{task.title}</span><span className="mt-1 flex items-center gap-1 text-[10px] text-slate-500"><Clock className="size-3 text-violet-500" />{format(start, 'MMM d')} – {format(due, 'MMM d, yyyy')}</span>{onViewInCalendar && <span className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-violet-600"><CalendarIcon className="size-3" />Open in calendar</span>}</span>
            </button>
        </div>;
    };

    return (
        <div ref={chartBodyRef} onScroll={handleScroll} className="relative flex-1 overflow-auto bg-white">
            <div style={{ width: `${timelineDays.length * columnWidth}px` }} className="relative min-h-full">
                <GanttMilestoneHeader timelineDays={timelineDays} columnWidth={columnWidth} milestones={milestones} selectedDate={selectedDate} onSelectDate={onSelectDate} />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[52px] z-0 flex">{timelineDays.map((day, index) => <div key={index} style={{ width: `${columnWidth}px` }} className={`h-full border-r ${day.getDay() === 0 || day.getDay() === 6 ? 'bg-slate-50/80 border-slate-100' : 'border-slate-100'}`} />)}</div>
                {selectedIndex >= 0 && <div style={{ left: `${selectedIndex * columnWidth + columnWidth / 2}px` }} className="pointer-events-none absolute bottom-0 top-[52px] z-20 border-l-2 border-dashed border-blue-500" />}
                <GanttDependencyLayer dependencyLines={dependencyLines} />
                <div className="relative z-10">{groupByStatus ? statusGroups.map((group) => <div key={group.status}>{<div className="h-10 border-b border-slate-100 bg-slate-50/80" />}{expandedGroups[group.status] !== false && group.tasks.map(taskBar)}</div>) : filteredTasks.map(taskBar)}</div>
            </div>
        </div>
    );
}
