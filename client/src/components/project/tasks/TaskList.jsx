/**
 * Task list: one readable row per task (title, status, priority, assignee, due), responsive without a separate mobile view.
 */
import { Link } from 'react-router-dom';
import { Lock, ChevronDown, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatStage } from '@/components/project/detail/taskFiltering';
import { TaskTypeIcon, PriorityBars, DueDate, Assignee } from '@/components/project/tasks/taskMeta';

const STATUS_TONE = {
    DONE: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    IN_PROGRESS: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    TODO: 'bg-slate-500/10 text-slate-600 dark:text-zinc-300',
};

const GRID = 'lg:grid lg:grid-cols-[28px_minmax(0,1fr)_150px_96px_170px_110px] lg:items-center lg:gap-4';

function StatusSelect({ task, stages, onChange }) {
    return (
        <label className={cn('relative inline-flex h-7 items-center rounded-full text-xs font-medium', STATUS_TONE[task.status] || 'bg-brand/10 text-brand dark:text-violet-300')}>
            <span className="sr-only">Status for {task.title}</span>
            <select
                value={task.status}
                onChange={(e) => onChange(task.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="h-full cursor-pointer appearance-none rounded-full bg-transparent pl-3 pr-7 outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
                {stages.map((s) => <option key={s} value={s}>{formatStage(s)}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 h-3 w-3 opacity-60" />
        </label>
    );
}

function TaskRow({ task, stages, isSelected, onToggle, onStatusChange }) {
    const isBlocked = task.dependencies?.some((d) => d.status !== 'DONE');
    const href = `/taskDetails?projectId=${task.projectId}&taskId=${task.id}`;

    return (
        <li className={cn('group relative grid grid-cols-[28px_minmax(0,1fr)] gap-x-3 gap-y-2 px-4 py-3 transition-colors', GRID, isSelected ? 'bg-brand/[0.06] dark:bg-lime/[0.05]' : 'hover:bg-white/70 dark:hover:bg-white/[0.03]')}>
            <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(task.id)}
                aria-label={`Select ${task.title}`}
                className="relative z-10 mt-0.5 h-4 w-4 cursor-pointer rounded accent-brand lg:mt-0"
            />
            <div className="flex min-w-0 items-center gap-2.5">
                <TaskTypeIcon type={task.type} />
                <Link to={href} className={cn('truncate text-sm font-medium after:absolute after:inset-0 focus-visible:outline-none', task.status === 'DONE' ? 'text-slate-400 line-through dark:text-zinc-500' : 'text-slate-900 dark:text-zinc-100')}>
                    {task.title}
                </Link>
                {isBlocked && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                        <Lock className="h-3 w-3" /> Blocked
                    </span>
                )}
            </div>
            {/* Meta: a wrapped row on small screens, aligned columns on desktop. */}
            <div className="relative z-10 col-start-2 flex flex-wrap items-center gap-x-4 gap-y-2 lg:contents">
                <div><StatusSelect task={task} stages={stages} onChange={onStatusChange} /></div>
                <div><PriorityBars priority={task.priority} /></div>
                <div className="min-w-0"><Assignee user={task.assignee} /></div>
                <div><DueDate task={task} /></div>
            </div>
        </li>
    );
}

/**
 * @param {{ tasks: Array<object>, stages: string[], selectedIds: string[], onSelectionChange: (ids: string[]) => void,
 *   onStatusChange: (id: string, status: string) => void, isFiltered: boolean, onClearFilters: () => void }} props
 */
export default function TaskList({ tasks, stages, selectedIds, onSelectionChange, onStatusChange, isFiltered, onClearFilters }) {
    const visibleIds = tasks.map((t) => t.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    const toggle = (id) => onSelectionChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
    const toggleAll = () => onSelectionChange(allSelected ? selectedIds.filter((id) => !visibleIds.includes(id)) : [...new Set([...selectedIds, ...visibleIds])]);

    if (!tasks.length) {
        return (
            <div className="sx-glass flex flex-col items-center rounded-3xl px-6 py-16 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand dark:bg-lime/10 dark:text-lime"><ListChecks className="h-6 w-6" /></span>
                <p className="mt-4 text-sm font-medium text-slate-900 dark:text-white">{isFiltered ? 'No tasks match these filters' : 'No tasks yet'}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">{isFiltered ? 'Try a different search or clear the filters.' : 'Create the first task to get this project moving.'}</p>
                {isFiltered && (
                    <button type="button" onClick={onClearFilters} className="mt-4 rounded-xl px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand/10 dark:text-lime dark:hover:bg-lime/10">Clear filters</button>
                )}
            </div>
        );
    }

    return (
        <div className="sx-glass overflow-hidden rounded-3xl">
            <div className={cn('hidden border-b border-slate-900/[0.06] px-4 py-2.5 text-xs font-medium text-slate-500 dark:border-white/[0.06] dark:text-zinc-400', GRID)}>
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all visible tasks" className="h-4 w-4 cursor-pointer rounded accent-brand" />
                <span>Task</span>
                <span>Status</span>
                <span>Priority</span>
                <span>Assignee</span>
                <span>Due</span>
            </div>
            <ul className="divide-y divide-slate-900/[0.05] dark:divide-white/[0.05]">
                {tasks.map((task) => (
                    <TaskRow key={task.id} task={task} stages={stages} isSelected={selectedIds.includes(task.id)} onToggle={toggle} onStatusChange={onStatusChange} />
                ))}
            </ul>
        </div>
    );
}
