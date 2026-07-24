import { Plus, Search, FolderKanban } from 'lucide-react';

export default function PortfolioHeader({ search, setSearch, onOpenCreate }) {
    return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900/60 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <FolderKanban className="size-6" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Project Portfolios</h1>
                    <p className="text-xs text-zinc-500">Group related strategic projects under enterprise umbrellas</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-2.5 size-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search portfolios..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-indigo-500"
                    />
                </div>
                <button
                    onClick={onOpenCreate}
                    className="flex items-center justify-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition cursor-pointer"
                >
                    <Plus className="size-4" />
                    New Portfolio
                </button>
            </div>
        </div>
    );
}
