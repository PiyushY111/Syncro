import { History, ShieldAlert, Users, Activity } from 'lucide-react';

export default function AuditMetricsWidget({ logs = [], total = 0 }) {
    const criticalCount = logs.filter((l) => l.severity === 'CRITICAL').length;
    const warningCount = logs.filter((l) => l.severity === 'WARNING').length;
    const uniqueUsers = new Set(logs.map((l) => l.userId)).size;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                    <p className="text-[11px] text-zinc-400 font-medium">Total Audit Events</p>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{total}</h3>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <History className="size-5" />
                </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                    <p className="text-[11px] text-zinc-400 font-medium">High Risk Alerts</p>
                    <h3 className="text-xl font-bold text-rose-600 dark:text-rose-400">{criticalCount}</h3>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <ShieldAlert className="size-5" />
                </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                    <p className="text-[11px] text-zinc-400 font-medium">Active Contributors</p>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{uniqueUsers}</h3>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Users className="size-5" />
                </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                    <p className="text-[11px] text-zinc-400 font-medium">State Updates</p>
                    <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400">{warningCount}</h3>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Activity className="size-5" />
                </div>
            </div>
        </div>
    );
}
