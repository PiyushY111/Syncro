import { Eye, ShieldAlert, Clock, ArrowRight } from 'lucide-react';

export default function AuditLogTable({ logs = [], onOpenDiff }) {
    const getSeverityBadge = (s) => {
        if (s === 'CRITICAL') return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
        if (s === 'WARNING') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    };

    const getActionBadge = (a) => {
        if (a === 'CREATE') return 'bg-emerald-500/10 text-emerald-600';
        if (a === 'DELETE') return 'bg-rose-500/10 text-rose-600';
        if (a === 'ROLLBACK') return 'bg-purple-500/10 text-purple-600 font-bold';
        if (a === 'ROLE_CHANGE') return 'bg-amber-500/10 text-amber-600 font-bold';
        return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400';
    };

    if (logs.length === 0) {
        return (
            <div className="p-10 text-center bg-white dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 text-xs">
                No audit log records found.
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
                <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500">
                        <th className="p-3 font-semibold">Actor</th>
                        <th className="p-3 font-semibold">Action</th>
                        <th className="p-3 font-semibold">Entity</th>
                        <th className="p-3 font-semibold">Risk Level</th>
                        <th className="p-3 font-semibold">Timestamp</th>
                        <th className="p-3 font-semibold text-right">Details</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition">
                            <td className="p-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-7 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-xs">
                                        {log.user?.name ? log.user.name[0].toUpperCase() : 'U'}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{log.user?.name || 'User'}</p>
                                        <p className="text-[10px] text-zinc-400">{log.user?.email}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${getActionBadge(log.action)}`}>
                                    {log.action}
                                </span>
                            </td>
                            <td className="p-3 font-medium text-zinc-800 dark:text-zinc-200">
                                <div>
                                    <p>{log.entityName || 'Entity'}</p>
                                    <span className="text-[10px] text-zinc-400 font-normal">{log.entityType}</span>
                                </div>
                            </td>
                            <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getSeverityBadge(log.severity)}`}>
                                    {log.severity}
                                </span>
                            </td>
                            <td className="p-3 text-zinc-500 text-[11px]">
                                {new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td className="p-3 text-right">
                                <button
                                    onClick={() => onOpenDiff(log)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-purple-600 hover:text-white text-zinc-700 dark:text-zinc-300 font-medium transition cursor-pointer"
                                >
                                    <Eye className="size-3.5" /> Diff
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
