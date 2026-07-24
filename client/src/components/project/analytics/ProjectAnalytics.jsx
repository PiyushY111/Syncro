import { useMemo } from 'react';
import { ArrowRightIcon } from 'lucide-react';
import AnalyticsMetrics from '@/components/project/analytics/AnalyticsMetrics';
import AnalyticsCharts from './AnalyticsCharts';

const PRIORITY_COLORS = {
    LOW: "text-red-600 bg-red-200 dark:text-red-500 dark:bg-red-600",
    MEDIUM: "text-blue-600 bg-blue-200 dark:text-blue-500 dark:bg-blue-600",
    HIGH: "text-emerald-600 bg-emerald-200 dark:text-emerald-500 dark:bg-emerald-600",
};

export default function ProjectAnalytics({ project, tasks }) {
    const { stats, statusData, typeData, priorityData } = useMemo(() => {
        const now = new Date();
        const total = tasks.length;
        const stats = { total, completed: 0, inProgress: 0, todo: 0, overdue: 0 };
        const statusMap = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
        const typeMap = { TASK: 0, BUG: 0, FEATURE: 0, IMPROVEMENT: 0, OTHER: 0 };
        const priorityMap = { LOW: 0, MEDIUM: 0, HIGH: 0 };

        tasks.forEach((t) => {
            if (t.status === "DONE") stats.completed++;
            if (t.status === "IN_PROGRESS") stats.inProgress++;
            if (t.status === "TODO") stats.todo++;
            if (new Date(t.due_date) < now && t.status !== "DONE") stats.overdue++;

            if (statusMap[t.status] !== undefined) statusMap[t.status]++;
            if (typeMap[t.type] !== undefined) typeMap[t.type]++;
            if (priorityMap[t.priority] !== undefined) priorityMap[t.priority]++;
        });

        return {
            stats,
            statusData: Object.entries(statusMap).map(([k, v]) => ({ name: k.replace("_", " "), value: v })),
            typeData: Object.entries(typeMap).filter(([, v]) => v > 0).map(([k, v]) => ({ name: k, value: v })),
            priorityData: Object.entries(priorityMap).map(([k, v]) => ({
                name: k,
                value: v,
                percentage: total > 0 ? Math.round((v / total) * 100) : 0,
            })),
        };
    }, [tasks]);

    const completionRate = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;

    return (
        <div className="space-y-6 text-left">
            <AnalyticsMetrics stats={stats} project={project} completionRate={completionRate} />
            <AnalyticsCharts statusData={statusData} typeData={typeData} />

            <div className="not-dark:bg-white dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-300 dark:border-zinc-800 rounded-lg p-6">
                <h2 className="text-zinc-900 dark:text-white mb-4 font-medium">Tasks by Priority</h2>
                <div className="space-y-4">
                    {priorityData.map((p) => (
                        <div key={p.name} className="space-y-2">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <ArrowRightIcon className={`size-3.5 ${PRIORITY_COLORS[p.name]} bg-transparent`} />
                                    <span className="text-zinc-900 dark:text-zinc-200 capitalize">{p.name.toLowerCase()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-zinc-600 dark:text-zinc-400 text-sm">{p.value} tasks</span>
                                    <span className="px-2 py-0.5 border border-zinc-400 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs rounded">{p.percentage}%</span>
                                </div>
                            </div>
                            <div className="w-full bg-zinc-300 dark:bg-zinc-800 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full ${PRIORITY_COLORS[p.name]}`} style={{ width: `${p.percentage}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
