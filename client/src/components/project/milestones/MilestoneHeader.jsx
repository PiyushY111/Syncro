import { Plus, Search, Filter } from 'lucide-react';

export default function MilestoneHeader({ filter, setFilter, search, setSearch, onOpenCreate }) {
    const filters = ['ALL', 'PLANNED', 'IN_PROGRESS', 'ACHIEVED'];

    return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-2.5 size-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search milestones..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
                    />
                </div>
                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
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
                className="flex items-center justify-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer"
            >
                <Plus className="size-4" />
                Add Milestone
            </button>
        </div>
    );
}
