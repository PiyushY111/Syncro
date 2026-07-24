import { ShieldAlert, AlertTriangle, KeyRound, UserX } from 'lucide-react';

export default function OwnerSecurityAlerts({ logs = [] }) {
    const criticalLogs = logs.filter((l) => l.severity === 'CRITICAL');
    const roleChanges = logs.filter((l) => l.action === 'ROLE_CHANGE');
    const deletions = logs.filter((l) => l.action === 'DELETE');

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 text-rose-600 dark:text-rose-400 space-y-1">
                <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs">Critical Anomaly Events</span>
                    <ShieldAlert className="size-4" />
                </div>
                <h3 className="text-2xl font-bold">{criticalLogs.length}</h3>
                <p className="text-[10px] opacity-80">Requires executive owner oversight</p>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-600 dark:text-amber-400 space-y-1">
                <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs">Role Elevation Events</span>
                    <KeyRound className="size-4" />
                </div>
                <h3 className="text-2xl font-bold">{roleChanges.length}</h3>
                <p className="text-[10px] opacity-80">Member role updates recorded</p>
            </div>

            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 text-purple-600 dark:text-purple-400 space-y-1">
                <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs">Entity Deletions</span>
                    <UserX className="size-4" />
                </div>
                <h3 className="text-2xl font-bold">{deletions.length}</h3>
                <p className="text-[10px] opacity-80">Deleted items recorded in system</p>
            </div>
        </div>
    );
}
