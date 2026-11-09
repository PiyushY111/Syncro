import { useState } from 'react';
import { History, Search, ShieldAlert, ShieldCheck, Crown, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuditChainVerifyModal from './AuditChainVerifyModal';

export default function AuditLogHeader({ search, setSearch, entityFilter, setEntityFilter, severityFilter, setSeverityFilter, isOwner, userRole, workspaceId }) {
    const navigate = useNavigate();
    const [isVerifyOpen, setIsVerifyOpen] = useState(false);

    const categories = ['ALL', 'TASK', 'PROJECT', 'MILESTONE', 'PORTFOLIO', 'USER'];
    const severities = ['ALL', 'INFO', 'WARNING', 'CRITICAL'];

    return (
        <div className="sx-glass sx-rise flex flex-col gap-4 p-6 rounded-3xl">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="sx-tile sx-tile-rose">
                        <History className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Audit Logs & System History</h1>
                        <p className="mt-0.5 text-sm text-slate-500 dark:text-zinc-400">Immutable platform audit events, version diffing, and change tracking</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {(isOwner || userRole === 'ADMIN') && (
                        <button
                            type="button"
                            onClick={() => setIsVerifyOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl transition shadow-xs cursor-pointer"
                        >
                            <ShieldCheck className="size-4" /> Verify Chain Integrity
                        </button>
                    )}

                    {isOwner && (
                        <button
                            onClick={() => navigate('/owner-audit')}
                            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition shadow-xs cursor-pointer"
                        >
                            <Crown className="size-4" /> Owner Security Command Center
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-900/[0.05] dark:border-white/[0.07] pt-3 text-xs">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-2.5 size-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search logs by user or entity name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-slate-500/[0.05] dark:bg-white/[0.06] border border-slate-900/[0.07] dark:border-white/10 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-brand"
                    />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 bg-slate-500/[0.08] dark:bg-white/[0.06] p-1 rounded-lg">
                        {categories.map((c) => (
                            <button
                                key={c}
                                onClick={() => setEntityFilter(c)}
                                className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition cursor-pointer ${entityFilter === c ? 'bg-brand text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>

                    <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-500/[0.05] dark:bg-white/[0.06] border border-slate-900/[0.07] dark:border-white/10 text-zinc-800 dark:text-zinc-200 font-medium cursor-pointer"
                    >
                        {severities.map((s) => (
                            <option key={s} value={s}>{s === 'ALL' ? 'All Severities' : s}</option>
                        ))}
                    </select>
                </div>
            </div>

            <AuditChainVerifyModal
                isOpen={isVerifyOpen}
                onClose={() => setIsVerifyOpen(false)}
                workspaceId={workspaceId}
            />
        </div>
    );
}
