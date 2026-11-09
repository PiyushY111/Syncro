import { CheckCircle, Clock, AlertTriangle, Users } from 'lucide-react';

export default function AnalyticsMetrics({ stats, project, completionRate }) {
    const metrics = [
        {
            label: "Completion Rate",
            value: `${completionRate}%`,
            color: "text-emerald-600 dark:text-emerald-400",
            icon: <CheckCircle className="size-5 text-emerald-600 dark:text-emerald-400" />,
            bg: "bg-emerald-200 dark:bg-emerald-500/10",
        },
        {
            label: "Active Tasks",
            value: stats.inProgress,
            color: "text-brand dark:text-violet-300",
            icon: <Clock className="size-5 text-brand dark:text-violet-300" />,
            bg: "bg-blue-200 dark:bg-brand/15",
        },
        {
            label: "Overdue Tasks",
            value: stats.overdue,
            color: "text-red-600 dark:text-red-400",
            icon: <AlertTriangle className="size-5 text-red-600 dark:text-red-400" />,
            bg: "bg-red-200 dark:bg-red-500/10",
        },
        {
            label: "Team Size",
            value: project?.members?.length || 0,
            color: "text-brand dark:text-violet-300",
            icon: <Users className="size-5 text-brand dark:text-violet-300" />,
            bg: "bg-purple-200 dark:bg-brand/15",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {metrics.map((m, i) => (
                <div
                    key={i}
                    className="not-dark:bg-white dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-slate-900/10 dark:border-white/[0.07] rounded-lg p-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm">{m.label}</p>
                            <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
                        </div>
                        <div className={`p-2 rounded-md ${m.bg}`}>{m.icon}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}
