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
        <div className="flex flex-col gap-4 bg-white dark:bg-zinc-900/60 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <InboxIcon className="size-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Universal Inbox</h1>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-600 text-white">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-zinc-500">Aggregated daily tasks, direct messages, and meeting invites</p>
                    </div>
                </div>

                <button
                    onClick={onMarkAllRead}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 transition cursor-pointer"
                >
                    <CheckCheck className="size-4 text-blue-500" />
                    Mark All as Read
                </button>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg overflow-x-auto no-scrollbar">
                    {filters.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`px-3 py-1 text-xs rounded-md font-medium transition whitespace-nowrap cursor-pointer ${filter === f.key ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
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
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-blue-500"
                    />
                </div>
            </div>
        </div>
    );
}
