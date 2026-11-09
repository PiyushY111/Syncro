/**
 * Tasks toolbar: search, compact filter chips, clear, and the List/Board switch.
 */
import { Search, X, List, Columns3, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EMPTY_TASK_FILTERS, formatStage, hasActiveFilters } from '@/components/project/detail/taskFiltering';

const PRIORITIES = [['HIGH', 'High'], ['MEDIUM', 'Medium'], ['LOW', 'Low']];
const TYPES = [['TASK', 'Task'], ['BUG', 'Bug'], ['FEATURE', 'Feature'], ['IMPROVEMENT', 'Improvement'], ['OTHER', 'Other']];
const VIEW_MODES = [{ key: 'list', label: 'List', icon: List }, { key: 'board', label: 'Board', icon: Columns3 }];

function FilterChip({ label, value, options, onChange }) {
    const isSet = Boolean(value);
    return (
        <label className={cn(
            'relative inline-flex h-9 shrink-0 items-center rounded-xl border text-xs font-medium transition-colors focus-within:ring-2 focus-within:ring-brand/30',
            isSet
                ? 'border-brand/30 bg-brand/10 text-brand dark:border-lime/30 dark:bg-lime/10 dark:text-lime'
                : 'border-slate-900/[0.08] bg-white/70 text-slate-600 hover:bg-white dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.07]'
        )}>
            <span className="sr-only">{label}</span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-full cursor-pointer appearance-none bg-transparent pl-3 pr-8 outline-none"
            >
                <option value="">{label}: All</option>
                {options.map(([v, text]) => <option key={v} value={v}>{label}: {text}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 opacity-60" />
        </label>
    );
}

/**
 * @param {{ filters: object, onChange: (next: object) => void, stages: string[], assignees: Array<{id: string, name: string}>,
 *   viewMode: 'list' | 'board', onViewModeChange: (mode: string) => void, resultCount: number, totalCount: number }} props
 */
export default function TaskToolbar({ filters, onChange, stages, assignees, viewMode, onViewModeChange, resultCount, totalCount }) {
    const set = (key) => (value) => onChange({ ...filters, [key]: value });
    const filtered = hasActiveFilters(filters);

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative w-full lg:max-w-xs">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                    <input
                        type="search"
                        value={filters.query}
                        onChange={(e) => set('query')(e.target.value)}
                        placeholder="Search tasks"
                        aria-label="Search tasks"
                        className="h-10 w-full rounded-xl border border-slate-900/[0.08] bg-white/70 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-100 dark:focus:border-lime/50 dark:focus:bg-white/[0.06] dark:focus:ring-lime/10"
                    />
                </div>

                <div className="no-scrollbar -mx-1 flex flex-1 items-center gap-2 overflow-x-auto px-1">
                    <FilterChip label="Status" value={filters.status} onChange={set('status')} options={stages.map((s) => [s, formatStage(s)])} />
                    <FilterChip label="Priority" value={filters.priority} onChange={set('priority')} options={PRIORITIES} />
                    <FilterChip label="Assignee" value={filters.assignee} onChange={set('assignee')} options={assignees.map((a) => [a.id, a.name])} />
                    <FilterChip label="Type" value={filters.type} onChange={set('type')} options={TYPES} />
                    {filtered && (
                        <button
                            type="button"
                            onClick={() => onChange(EMPTY_TASK_FILTERS)}
                            className="inline-flex h-9 shrink-0 items-center gap-1 rounded-xl px-2.5 text-xs font-medium text-slate-500 hover:bg-slate-500/[0.08] hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
                        >
                            <X className="h-3.5 w-3.5" /> Clear
                        </button>
                    )}
                </div>

                <div role="tablist" aria-label="Task layout" className="inline-flex shrink-0 items-center gap-1 self-start rounded-xl bg-slate-500/[0.08] p-1 lg:self-auto dark:bg-white/[0.05]">
                    {VIEW_MODES.map(({ key, label, icon }) => {
                        const ModeIcon = icon;
                        return (
                            <button
                                key={key}
                                type="button"
                                role="tab"
                                aria-selected={viewMode === key}
                                onClick={() => onViewModeChange(key)}
                                className={cn(
                                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                                    viewMode === key ? 'bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
                                )}
                            >
                                <ModeIcon className="h-3.5 w-3.5" /> {label}
                            </button>
                        );
                    })}
                </div>
            </div>
            {filtered && (
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Showing <span className="font-data font-medium text-slate-900 dark:text-white">{resultCount}</span> of {totalCount} tasks
                </p>
            )}
        </div>
    );
}
