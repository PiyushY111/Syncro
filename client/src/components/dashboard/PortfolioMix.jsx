/**
 * Portfolio mix: project count by status plus average delivery progress.
 */
import { PieChart } from 'lucide-react';
import Panel, { PanelEmpty } from '@/components/dashboard/Panel';
import { getProjectProgress, getStatusBreakdown } from '@/components/dashboard/dashboardMetrics';

/** @param {{ projects: Array<object>, className?: string, delay?: number }} props */
export default function PortfolioMix({ projects, className, delay }) {
    const breakdown = getStatusBreakdown(projects);
    const live = projects.filter((p) => p.status !== 'CANCELLED');
    const avgProgress = live.length ? Math.round(live.reduce((sum, p) => sum + getProjectProgress(p), 0) / live.length) : 0;

    return (
        <Panel eyebrow="By status" title="Portfolio mix" className={className} delay={delay}>
            {projects.length === 0 ? (
                <PanelEmpty icon={PieChart} title="No projects yet" />
            ) : (
                <>
                    <div className="flex items-baseline gap-2">
                        <span className="font-data text-[44px] font-medium leading-none tracking-tight text-slate-900 dark:text-zinc-50">{projects.length}</span>
                        <span className="text-sm text-slate-500 dark:text-zinc-400">projects</span>
                    </div>

                    <div className="mt-5 flex h-3 w-full gap-[3px]" aria-hidden>
                        {breakdown.map((item) => (
                            <span
                                key={item.status}
                                className="h-full rounded-[4px]"
                                style={{ flexGrow: item.count, backgroundColor: item.color }}
                                title={`${item.label}: ${item.count}`}
                            />
                        ))}
                    </div>

                    <ul className="mt-5 space-y-2.5">
                        {breakdown.map((item) => (
                            <li key={item.status} className="flex items-center gap-2.5 text-sm">
                                <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: item.color }} />
                                <span className="flex-1 text-slate-600 dark:text-zinc-300">{item.label}</span>
                                <span className="font-data text-slate-900 dark:text-zinc-100">{item.count}</span>
                                <span className="font-data w-10 text-right text-xs text-slate-400 dark:text-zinc-500">{item.percentage}%</span>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-5 flex items-center justify-between rounded-2xl bg-white/60 px-3.5 py-3 dark:bg-white/[0.04]">
                        <span className="text-xs text-slate-500 dark:text-zinc-400">Avg. progress</span>
                        <span className="font-data text-sm font-medium text-slate-900 dark:text-zinc-100">{avgProgress}%</span>
                    </div>
                </>
            )}
        </Panel>
    );
}
