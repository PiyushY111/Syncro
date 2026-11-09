import { Plus, Search, Filter } from 'lucide-react';

export default function MilestoneHeader({ filter, setFilter, search, setSearch, onOpenCreate }) {
    const filters = ['ALL', 'PLANNED', 'IN_PROGRESS', 'ACHIEVED'];

    return (
        <div className="sx-glass flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl">
            <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-2.5 size-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search milestones..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-500/[0.05] dark:bg-white/[0.06] border border-slate-900/[0.07] dark:border-white/10 rounded-lg focus:outline-hidden focus:border-brand text-zinc-900 dark:text-zinc-100"
                    />
                </div>
                <div className="flex items-center gap-1 bg-slate-500/[0.08] dark:bg-white/[0.06] p-1 rounded-lg">
                    {filters.map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-2.5 py-1 text-xs rounded-md font-medium transition cursor-pointer ${filter === f ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>
            <button
                onClick={onOpenCreate}
                className="flex items-center justify-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-brand hover:bg-brand-strong rounded-lg shadow-xs transition cursor-pointer"
            >
                <Plus className="size-4" />
                Add Milestone
            </button>
        </div>
    );
}
