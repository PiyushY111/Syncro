import { Layers, Activity, CheckCircle2, Flag } from 'lucide-react';

export default function PortfolioMetrics({ portfolio }) {
    const { projectCount, taskProgress, milestoneProgress, totalTasks, completedTasks, totalMilestones, achievedMilestones } = portfolio;

    const cards = [
        {
            title: 'Grouped Projects',
            value: projectCount || 0,
            sub: 'Active initiatives',
            icon: Layers,
            color: 'text-indigo-500 bg-indigo-500/10'
        },
        {
            title: 'Task Progress',
            value: `${taskProgress || 0}%`,
            sub: `${completedTasks || 0} of ${totalTasks || 0} tasks done`,
            icon: Activity,
            color: 'text-blue-500 bg-blue-500/10'
        },
        {
            title: 'Milestone Health',
            value: `${milestoneProgress || 0}%`,
            sub: `${achievedMilestones || 0} of ${totalMilestones || 0} achieved`,
            icon: Flag,
            color: 'text-emerald-500 bg-emerald-500/10'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cards.map((c, i) => (
                <div key={i} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${c.color}`}>
                        <c.icon className="size-5" />
                    </div>
                    <div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{c.title}</p>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{c.value}</h3>
                        <p className="text-[11px] text-zinc-400 mt-0.5">{c.sub}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
