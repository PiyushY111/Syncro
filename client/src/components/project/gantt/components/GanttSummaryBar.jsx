import { useMemo } from 'react';
import { format, differenceInDays } from 'date-fns';
import { Clock, CheckCircle2, AlertTriangle, Zap, BarChart2 } from 'lucide-react';

export default function GanttSummaryBar({ tasks, criticalPathCount, hasConflicts }) {
    const stats = useMemo(() => {
        if (!tasks || tasks.length === 0) return { total: 0, done: 0, percent: 0, start: new Date(), end: new Date(), days: 0 };
        const done = tasks.filter(t => t.status === 'DONE').length;
        const percent = Math.round((done / tasks.length) * 100);
        const starts = tasks.map(t => t.start_date ? new Date(t.start_date) : new Date(t.createdAt));
        const dues = tasks.map(t => new Date(t.due_date));
        const minStart = new Date(Math.min(...starts));
        const maxDue = new Date(Math.max(...dues));
        const days = Math.max(1, differenceInDays(maxDue, minStart) + 1);
        return { total: tasks.length, done, percent, start: minStart, end: maxDue, days };
    }, [tasks]);

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-2.5 text-xs">
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5 font-medium text-slate-600">
                    <Clock className="size-3.5 text-violet-500" />
                    <span>Timeline: <strong>{format(stats.start, 'MMM d')} – {format(stats.end, 'MMM d, yyyy')}</strong> ({stats.days} days)</span>
                </div>
                <div className="flex items-center gap-2">
                    <BarChart2 className="size-3.5 text-emerald-500" />
                    <span className="font-medium text-slate-500">Progress: {stats.done}/{stats.total} ({stats.percent}%)</span>
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                        <div style={{ width: `${stats.percent}%` }} className="h-full rounded-full bg-violet-500 transition-all duration-500" />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {criticalPathCount > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/40">
                        <Zap className="size-3" /> {criticalPathCount} Critical Path
                    </span>
                )}
                {hasConflicts && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded border border-red-200 dark:border-red-800/40">
                        <AlertTriangle className="size-3" /> Schedule Overlaps
                    </span>
                )}
            </div>
        </div>
    );
}
