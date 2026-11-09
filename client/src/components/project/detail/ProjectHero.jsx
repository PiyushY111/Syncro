/**
 * Project header card: identity, status, progress, team and the three numbers that matter.
 */
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ChevronLeft, Plus, CalendarDays, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { getInitials, getProjectStatusMeta } from '@/components/dashboard/dashboardMetrics';
import { summarizeTasks } from '@/components/project/detail/taskFiltering';

const MAX_AVATARS = 5;

function Avatar({ user, className }) {
    if (user?.image) return <img src={user.image} alt={user.name || ''} className={cn('rounded-full object-cover', className)} />;
    return (
        <span className={cn('flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#7c5cff,#38bdf8)] text-[10px] font-semibold text-white', className)}>
            {getInitials(user?.name || user?.email || '')}
        </span>
    );
}

function TeamStack({ members }) {
    const shown = members.slice(0, MAX_AVATARS);
    const extra = members.length - shown.length;
    if (!members.length) return <span className="text-sm text-slate-400 dark:text-zinc-500">No members yet</span>;
    return (
        <div className="flex items-center">
            <div className="flex -space-x-2">
                {shown.map((m) => (
                    <span key={m.user?.id || m.userId} title={m.user?.name || m.user?.email} className="rounded-full ring-2 ring-white dark:ring-[#14161f]">
                        <Avatar user={m.user} className="h-7 w-7" />
                    </span>
                ))}
            </div>
            {extra > 0 && <span className="ml-2 text-xs font-medium text-slate-500 dark:text-zinc-400">+{extra}</span>}
        </div>
    );
}

function Stat({ label, value, tone }) {
    return (
        <div className="min-w-0">
            <p className={cn('font-data text-2xl font-semibold leading-none tracking-tight', tone || 'text-slate-900 dark:text-white')}>{value}</p>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400">{label}</p>
        </div>
    );
}

const formatDue = (date) => {
    const parsed = date ? new Date(date) : null;
    return parsed && !Number.isNaN(parsed.getTime()) ? format(parsed, 'MMM d, yyyy') : null;
};

/** @param {{ project: object, tasks: Array<object>, canCreate: boolean, onNewTask: () => void }} props */
export default function ProjectHero({ project, tasks, canCreate, onNewTask }) {
    const status = getProjectStatusMeta(project.status);
    const summary = summarizeTasks(tasks);
    const members = project.members || [];
    const due = formatDue(project.end_date);

    return (
        <section aria-label="Project overview" className="sx-glass sx-rise relative isolate overflow-hidden rounded-3xl p-6 sm:p-7">
            <span aria-hidden className="pointer-events-none absolute -right-20 -top-24 -z-10 h-64 w-64 rounded-full opacity-30 blur-3xl" style={{ backgroundColor: status.color }} />

            <Link to="/projects" className="inline-flex items-center gap-1 rounded-lg text-xs font-medium text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 dark:text-zinc-400 dark:hover:text-white">
                <ChevronLeft className="h-3.5 w-3.5" /> Projects
            </Link>

            <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tight text-slate-900 sm:text-[30px] dark:text-white">{project.name}</h1>
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset', status.pill)}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} /> {status.label}
                        </span>
                    </div>
                    {project.description && (
                        <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-zinc-400">{project.description}</p>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-600 dark:text-zinc-300">
                        <TeamStack members={members} />
                        {due && (
                            <span className="inline-flex items-center gap-1.5">
                                <CalendarDays className="h-4 w-4 text-slate-400 dark:text-zinc-500" /> Due {due}
                            </span>
                        )}
                    </div>
                </div>

                {canCreate && (
                    <Button onClick={onNewTask} className="h-10 gap-2 self-start px-4">
                        <Plus className="h-4 w-4" strokeWidth={2.4} /> New task
                    </Button>
                )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-5 border-t border-slate-900/[0.06] pt-5 sm:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))] dark:border-white/[0.06]">
                <div className="col-span-2 sm:col-span-1">
                    <div className="flex items-baseline justify-between">
                        <span className="text-xs text-slate-500 dark:text-zinc-400">Progress</span>
                        <span className="font-data text-sm font-semibold text-slate-900 dark:text-white">{summary.progress}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-500/[0.1] dark:bg-white/[0.08]" role="progressbar" aria-valuenow={summary.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Project progress">
                        <div className="h-full rounded-full bg-[linear-gradient(90deg,#7c5cff,#38bdf8)] transition-[width] duration-700" style={{ width: `${summary.progress}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">{summary.done} of {summary.total} tasks done</p>
                </div>
                <Stat label="Open tasks" value={summary.open} />
                <Stat label="Done" value={summary.done} tone="text-emerald-600 dark:text-emerald-400" />
                <div className="flex items-start gap-2">
                    <Stat label="Overdue" value={summary.overdue} tone={summary.overdue ? 'text-rose-600 dark:text-rose-400' : undefined} />
                    {summary.overdue > 0 && <AlertTriangle className="mt-1 h-4 w-4 text-rose-500" aria-hidden />}
                </div>
            </div>
        </section>
    );
}
