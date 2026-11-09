/**
 * Bento hero: gradient greeting tile, glass progress ring, and bold KPI tiles (overdue, assigned to you).
 */
import { Link } from 'react-router-dom';
import { Plus, ArrowUpRight, AlertTriangle, CheckCircle2, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import ProgressRing from '@/components/dashboard/ProgressRing';

const MORNING_END_HOUR = 12;
const AFTERNOON_END_HOUR = 18;
const RING_GRADIENT = ['#7c5cff', '#38bdf8'];

const greetingFor = (hour) => {
    if (hour < MORNING_END_HOUR) return 'Good morning';
    if (hour < AFTERNOON_END_HOUR) return 'Good afternoon';
    return 'Good evening';
};

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

const Strong = ({ children }) => (
    <span className="font-semibold text-white underline decoration-lime/80 decoration-2 underline-offset-[5px]">{children}</span>
);

/** Decorative blurred orbs that give the gradient tiles depth. */
const Orb = ({ className }) => <span aria-hidden className={cn('pointer-events-none absolute rounded-full blur-3xl', className)} />;

function GreetingTile({ userName, workspaceName, stats, myDueThisWeek, onNewProject }) {
    const now = new Date();
    const today = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const workspace = workspaceName || 'Your workspace';

    return (
        <div className="sx-rise relative isolate col-span-2 flex flex-col justify-between overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#5b3fe6_0%,#7c5cff_45%,#38bdf8_125%)] p-6 text-white shadow-[0_24px_48px_-24px_rgba(98,70,234,0.7)] sm:p-8 lg:col-span-6 lg:row-span-2 dark:bg-[linear-gradient(135deg,#3a24b8_0%,#5638e0_50%,#0e7490_135%)]">
            <Orb className="-right-16 -top-20 -z-10 h-64 w-64 bg-white/25" />
            <Orb className="-bottom-24 right-10 -z-10 h-56 w-56 bg-lime/40" />
            <div>
                <p className="text-sm text-white/70">{today} · {workspace}</p>
                <h1 className="mt-3 text-3xl font-semibold leading-[1.1] tracking-tight sm:text-[40px]">
                    {greetingFor(now.getHours())}, {userName} <span className="inline-block origin-[70%_70%] motion-safe:animate-[wave_2.2s_ease-in-out_1]">👋</span>
                </h1>
                <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/80">
                    You have <Strong>{plural(stats.myOpenTasks, 'open task')}</Strong>
                    {myDueThisWeek > 0 ? <>, {myDueThisWeek} due this week</> : null}. {workspace} has closed{' '}
                    <Strong>{stats.doneTasks} of {plural(stats.totalTasks, 'task')}</Strong> so far.
                </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={onNewProject}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-brand shadow-lg shadow-black/10 transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:translate-y-0 dark:text-[#3a24b8]"
                >
                    <Plus className="h-4 w-4" strokeWidth={2.4} /> New project
                </button>
                <Link
                    to="/inbox"
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                    Open inbox <ArrowUpRight className="h-4 w-4 text-white/70" />
                </Link>
            </div>
        </div>
    );
}

function ProgressTile({ stats }) {
    return (
        <div style={{ '--rise-delay': '60ms' }} className="sx-glass sx-rise col-span-2 flex flex-col items-center justify-center gap-4 rounded-3xl p-6 text-center sm:col-span-1 sm:row-span-2 lg:col-span-3">
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">Workspace progress</p>
            <ProgressRing value={stats.taskCompletionRate} size={150} stroke={12} gradient={RING_GRADIENT} label={`Workspace ${stats.taskCompletionRate}% complete`}>
                <p className="font-data text-[40px] font-semibold leading-none tracking-tight text-slate-900 dark:text-white">
                    {stats.taskCompletionRate}<span className="text-lg text-slate-400 dark:text-zinc-500">%</span>
                </p>
            </ProgressRing>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
                <span className="font-data font-semibold text-slate-900 dark:text-zinc-100">{stats.doneTasks}/{stats.totalTasks}</span> tasks ·{' '}
                <span className="font-data font-semibold text-slate-900 dark:text-zinc-100">{stats.openProjects}</span> open projects
            </p>
        </div>
    );
}

function StatTile({ icon, value, label, hint, className, delay }) {
    const Icon = icon;
    return (
        <div
            style={{ '--rise-delay': `${delay}ms` }}
            className={cn('sx-rise relative isolate flex min-h-[132px] flex-col justify-between overflow-hidden rounded-3xl p-5 lg:col-span-3', className)}
        >
            <Orb className="-right-10 -top-10 -z-10 h-32 w-32 bg-white/30" />
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium opacity-80">{label}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm"><Icon className="h-4 w-4" /></span>
            </div>
            <div>
                <p className="font-data text-[40px] font-semibold leading-none tracking-tight">{value}</p>
                <p className="mt-1.5 text-xs opacity-75">{hint}</p>
            </div>
        </div>
    );
}

/** @param {{ userName: string, workspaceName?: string, stats: object, myDueThisWeek: number, onNewProject: () => void }} props */
export default function BentoHero({ userName, workspaceName, stats, myDueThisWeek, onNewProject }) {
    const hasOverdue = stats.overdueTasks > 0;
    return (
        <section aria-label="Overview" className="grid grid-cols-2 gap-4 lg:grid-cols-12">
            <GreetingTile userName={userName} workspaceName={workspaceName} stats={stats} myDueThisWeek={myDueThisWeek} onNewProject={onNewProject} />
            <ProgressTile stats={stats} />
            <StatTile
                icon={hasOverdue ? AlertTriangle : CheckCircle2}
                value={stats.overdueTasks}
                label={hasOverdue ? 'Overdue' : 'On track'}
                hint={hasOverdue ? 'Past due and not done' : 'Nothing is overdue'}
                delay={100}
                className={hasOverdue
                    ? 'bg-[linear-gradient(135deg,#fb7185,#f43f5e)] text-white shadow-[0_18px_36px_-20px_rgba(244,63,94,0.8)]'
                    : 'bg-[linear-gradient(135deg,#34d399,#059669)] text-white shadow-[0_18px_36px_-20px_rgba(5,150,105,0.8)]'}
            />
            <StatTile
                icon={UserRound}
                value={stats.myOpenTasks}
                label="Assigned to you"
                hint={myDueThisWeek > 0 ? `${myDueThisWeek} due this week` : 'Nothing due this week'}
                delay={140}
                className="bg-lime text-ink shadow-[0_18px_36px_-20px_rgba(132,204,22,0.9)]"
            />
        </section>
    );
}
