/**
 * Shared task presentation bits used by both the list and the board: type icon, priority bars, assignee, due date.
 */
import { format } from 'date-fns';
import { Bug, Zap, CircleDot, Sparkles, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getInitials, isTaskOverdue } from '@/components/dashboard/dashboardMetrics';

const TYPE_META = {
    BUG: { icon: Bug, label: 'Bug', className: 'text-rose-500' },
    FEATURE: { icon: Zap, label: 'Feature', className: 'text-brand dark:text-violet-300' },
    TASK: { icon: CircleDot, label: 'Task', className: 'text-sky-500' },
    IMPROVEMENT: { icon: Sparkles, label: 'Improvement', className: 'text-emerald-500' },
    OTHER: { icon: MessageSquare, label: 'Other', className: 'text-slate-400' },
};

const PRIORITY_META = {
    HIGH: { label: 'High', bars: 3, className: 'text-rose-600 dark:text-rose-400' },
    MEDIUM: { label: 'Medium', bars: 2, className: 'text-amber-600 dark:text-amber-400' },
    LOW: { label: 'Low', bars: 1, className: 'text-slate-500 dark:text-zinc-400' },
};

/** Task type glyph with an accessible label. */
export function TaskTypeIcon({ type, className }) {
    const meta = TYPE_META[type] || TYPE_META.OTHER;
    const Glyph = meta.icon;
    return <Glyph className={cn('h-4 w-4 shrink-0', meta.className, className)} aria-label={meta.label} />;
}

export function PriorityBars({ priority }) {
    const meta = PRIORITY_META[priority] || PRIORITY_META.LOW;
    return (
        <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', meta.className)}>
            <span className="flex items-end gap-[2px]" aria-hidden>
                {[1, 2, 3].map((n) => (
                    <span key={n} className={cn('w-[3px] rounded-full', n <= meta.bars ? 'bg-current' : 'bg-current opacity-20')} style={{ height: 4 + n * 3 }} />
                ))}
            </span>
            {meta.label}
        </span>
    );
}

export function DueDate({ task }) {
    const date = task.due_date ? new Date(task.due_date) : null;
    if (!date || Number.isNaN(date.getTime())) return <span className="text-xs text-slate-400 dark:text-zinc-500">No date</span>;
    const overdue = isTaskOverdue(task);
    return (
        <span className={cn('font-data text-xs', overdue ? 'font-semibold text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-zinc-300')}>
            {overdue ? 'Overdue · ' : ''}{format(date, 'MMM d')}
        </span>
    );
}

export function Assignee({ user, compact = false }) {
    if (!user) return <span className="text-xs text-slate-400 dark:text-zinc-500">Unassigned</span>;
    return (
        <span title={user.name} className="flex min-w-0 items-center gap-2 text-sm text-slate-700 dark:text-zinc-200">
            {user.image
                ? <img src={user.image} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" />
                : <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#7c5cff,#38bdf8)] text-[10px] font-semibold text-white">{getInitials(user.name)}</span>}
            {!compact && <span className="truncate">{user.name}</span>}
        </span>
    );
}

