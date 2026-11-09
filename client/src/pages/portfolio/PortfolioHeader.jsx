import { Plus, Search, FolderKanban } from 'lucide-react';

export default function PortfolioHeader({ search, setSearch, onOpenCreate }) {
    return (
        <div className="sx-glass sx-rise flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-6 rounded-3xl">
            <div className="flex items-center gap-3">
                <div className="sx-tile">
                    <FolderKanban className="size-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Project Portfolios</h1>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-zinc-400">Group related strategic projects under enterprise umbrellas</p>
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
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-500/[0.05] dark:bg-white/[0.06] border border-slate-900/[0.07] dark:border-white/10 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-brand"
                    />
                </div>
                <button
                    onClick={onOpenCreate}
                    className="flex items-center justify-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-brand hover:bg-brand-strong rounded-lg shadow-xs transition cursor-pointer"
                >
                    <Plus className="size-4" />
                    New Portfolio
                </button>
            </div>
        </div>
    );
}
