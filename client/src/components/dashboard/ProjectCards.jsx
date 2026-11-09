/**
 * Project cards: the most recently updated projects with progress rings, task counts and team.
 */
import { Link } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import { ArrowRight, CalendarDays, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ProgressRing from '@/components/dashboard/ProgressRing';
import { panelLinkClass } from '@/components/dashboard/Panel';
import { getInitials, getProjectProgress, getProjectStatusMeta } from '@/components/dashboard/dashboardMetrics';

const MAX_AVATARS = 3;

const formatDate = (value) => {
    const date = value ? new Date(value) : null;
    return date && isValid(date) ? format(date, 'MMM d') : null;
};

function Members({ members = [] }) {
    const visible = members.slice(0, MAX_AVATARS);
    const extra = members.length - visible.length;
    if (visible.length === 0) return null;
    return (
        <div className="flex -space-x-2">
            {visible.map((member, index) => {
                const person = member.user || member;
                return (
                    <Avatar key={member.id || person.id || index} className="h-6 w-6 ring-2 ring-white dark:ring-zinc-900">
                        <AvatarImage src={person.image} alt={person.name || ''} />
                        <AvatarFallback className="bg-brand-tint text-[9px] font-semibold text-brand dark:bg-brand/25 dark:text-violet-200">
                            {getInitials(person.name || person.email || '')}
                        </AvatarFallback>
                    </Avatar>
                );
            })}
            {extra > 0 && (
                <span className="font-data flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[9px] text-slate-600 ring-2 ring-white dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-900">+{extra}</span>
            )}
        </div>
    );
}

function ProjectCard({ project, index }) {
    const progress = getProjectProgress(project);
    const status = getProjectStatusMeta(project.status);
    const total = project.tasks?.length || 0;
    const done = (project.tasks || []).filter((t) => t.status === 'DONE').length;
    const due = formatDate(project.end_date);

    return (
        <Link
            to={`/projectsDetail?id=${project.id}&tab=tasks`}
            style={{ '--rise-delay': `${120 + index * 50}ms` }}
            className="sx-glass sx-rise group relative isolate flex flex-col overflow-hidden rounded-3xl p-5 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_24px_40px_-22px_rgba(98,70,234,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
            <span aria-hidden className="pointer-events-none absolute -right-10 -top-12 -z-10 h-36 w-36 rounded-full opacity-35 blur-3xl transition-opacity duration-300 group-hover:opacity-60" style={{ backgroundColor: status.color }} />
            <div className="flex items-start justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:bg-white/[0.06] dark:text-zinc-300">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: status.color }} />
                    {status.label}
                </span>
                <ProgressRing value={progress} size={46} stroke={4} gradient={progress >= 100 ? ['#34d399', '#059669'] : ['#7c5cff', '#38bdf8']}>
                    <span className="font-data text-[11px] font-medium text-slate-700 dark:text-zinc-200">{progress}</span>
                </ProgressRing>
            </div>

            <h3 className="mt-3 truncate text-[15px] font-semibold tracking-tight text-slate-900 transition-colors group-hover:text-brand dark:text-zinc-50 dark:group-hover:text-violet-300">
                {project.name}
            </h3>
            <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-[13px] leading-5 text-slate-500 dark:text-zinc-400">
                {project.description || 'No description yet.'}
            </p>

            <div className="mt-4 flex items-center gap-4 border-t border-black/[0.05] pt-4 text-xs text-slate-500 dark:border-white/[0.05] dark:text-zinc-400">
                <span className="font-data">{done}/{total} tasks</span>
                {due && (
                    <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />{due}
                    </span>
                )}
                <span className="ml-auto"><Members members={project.members} /></span>
            </div>
        </Link>
    );
}

/** @param {{ projects: Array<object>, totalCount: number, onNewProject: () => void }} props */
export default function ProjectCards({ projects, totalCount, onNewProject }) {
    return (
        <section aria-labelledby="dashboard-projects">
            <div className="mb-3 flex items-end justify-between gap-4 px-1">
                <div>
                    <p className="font-data mb-1 text-xs font-medium text-slate-400 dark:text-zinc-500">
                        {totalCount} in workspace
                    </p>
                    <h2 id="dashboard-projects" className="text-[17px] font-semibold tracking-tight text-slate-900 dark:text-zinc-50">Projects</h2>
                </div>
                <div className="flex items-center gap-1">
                    <button type="button" onClick={onNewProject} className={panelLinkClass}><Plus className="h-3.5 w-3.5" /> New</button>
                    <Link to="/projects" className={panelLinkClass}>View all <ArrowRight className="h-3.5 w-3.5" /></Link>
                </div>
            </div>

            {projects.length === 0 ? (
                <button
                    type="button"
                    onClick={onNewProject}
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black/[0.08] py-12 text-sm text-slate-500 transition-colors hover:border-brand/40 hover:text-brand dark:border-white/[0.08] dark:text-zinc-400"
                >
                    <Plus className="h-5 w-5" /> Create your first project
                </button>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {projects.map((project, index) => <ProjectCard key={project.id} project={project} index={index} />)}
                </div>
            )}
        </section>
    );
}
