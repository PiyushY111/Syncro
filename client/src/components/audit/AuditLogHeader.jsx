import { History, Search, ShieldAlert, Crown, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AuditLogHeader({ search, setSearch, entityFilter, setEntityFilter, severityFilter, setSeverityFilter, isOwner }) {
    const navigate = useNavigate();

    const categories = ['ALL', 'TASK', 'PROJECT', 'MILESTONE', 'PORTFOLIO', 'USER'];
    const severities = ['ALL', 'INFO', 'WARNING', 'CRITICAL'];

    return (
        <div className="flex flex-col gap-4 bg-white dark:bg-zinc-900/60 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        <History className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Audit Logs & System History</h1>
                        <p className="text-xs text-zinc-500">Immutable platform audit events, version diffing, and change tracking</p>
                    </div>
                </div>

                {isOwner && (
                    <button
                        onClick={() => navigate('/owner-audit')}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition shadow-xs cursor-pointer"
                    >
                        <Crown className="size-4" /> Owner Security Command Center
                    </button>
                )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-zinc-100 dark:border-zinc-800/80 pt-3 text-xs">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-2.5 size-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search logs by user or entity name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-purple-500"
                    />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                        {categories.map((c) => (
                            <button
                                key={c}
                                onClick={() => setEntityFilter(c)}
                                className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition cursor-pointer ${entityFilter === c ? 'bg-purple-600 text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>

                    <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium cursor-pointer"
                    >
                        {severities.map((s) => (
                            <option key={s} value={s}>{s === 'ALL' ? 'All Severities' : s}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}
