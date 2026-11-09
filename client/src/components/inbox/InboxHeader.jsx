import { Search, CheckCheck, Inbox as InboxIcon } from 'lucide-react';

export default function InboxHeader({ filter, setFilter, search, setSearch, unreadCount, onMarkAllRead }) {
    const filters = [
        { key: 'ALL', label: 'All' },
        { key: 'TASKS', label: 'Tasks' },
        { key: 'MESSAGES', label: 'Messages' },
        { key: 'MEETINGS', label: 'Meetings' },
        { key: 'SYSTEM', label: 'System' }
    ];

    return (
        <div className="sx-glass sx-rise flex flex-col gap-4 p-6 rounded-3xl">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="sx-tile sx-tile-sky">
                        <InboxIcon className="size-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Universal Inbox</h1>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-brand text-white">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        <p className="mt-0.5 text-sm text-slate-500 dark:text-zinc-400">Aggregated daily tasks, direct messages, and meeting invites</p>
                    </div>
                </div>

                <button
                    onClick={onMarkAllRead}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-slate-500/10 dark:hover:bg-white/[0.07] rounded-lg border border-slate-900/[0.07] dark:border-white/10 transition cursor-pointer"
                >
                    <CheckCheck className="size-4 text-brand dark:text-lime" />
                    Mark All as Read
                </button>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-900/[0.05] dark:border-white/[0.07]">
                <div className="flex items-center gap-1 bg-slate-500/[0.08] dark:bg-white/[0.06] p-1 rounded-lg overflow-x-auto no-scrollbar">
                    {filters.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`px-3 py-1 text-xs rounded-md font-medium transition whitespace-nowrap cursor-pointer ${filter === f.key ? 'bg-brand text-white shadow-sm dark:bg-lime dark:text-ink' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="relative max-w-xs w-full">
                    <Search className="absolute left-3 top-2.5 size-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search notifications..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-500/[0.05] dark:bg-white/[0.06] border border-slate-900/[0.07] dark:border-white/10 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-brand"
                    />
                </div>
            </div>
        </div>
    );
}
