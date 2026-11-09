import { Search } from 'lucide-react';

export default function CalendarFilters({ searchQuery, setSearchQuery, typeFilter, setTypeFilter, priorityFilter, setPriorityFilter }) {
    return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border-t border-slate-900/[0.05] dark:border-white/[0.07] pt-3">
            <div className="relative flex-1">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Filter calendar tasks..." className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-500/[0.05] dark:bg-white/[0.04] border border-slate-900/[0.07] dark:border-white/[0.07] text-zinc-900 dark:text-white focus:outline-none focus:border-brand" />
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-1.5 text-xs rounded-lg bg-slate-500/[0.05] dark:bg-white/[0.02] border border-slate-900/[0.07] dark:border-white/[0.07] text-zinc-800 dark:text-zinc-200 focus:outline-none">
                <option value="ALL">All Types</option>
                <option value="BUG">Bug</option>
                <option value="FEATURE">Feature</option>
                <option value="TASK">Task</option>
                <option value="IMPROVEMENT">Improvement</option>
                <option value="OTHER">Other</option>
            </select>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="px-3 py-1.5 text-xs rounded-lg bg-slate-500/[0.05] dark:bg-white/[0.02] border border-slate-900/[0.07] dark:border-white/[0.07] text-zinc-800 dark:text-zinc-200 focus:outline-none">
                <option value="ALL">All Priorities</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
            </select>
        </div>
    );
}
