/**
 * Recent projects in the sidebar. Collapsed: a colour-coded initial tile per project. Expanded: name and progress.
 */
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getProjectProgress, getProjectStatusMeta, sortByRecentUpdate } from '@/components/dashboard/dashboardMetrics';
import { railText } from '@/components/layout/useSidebarRail';

const MAX_PROJECTS = 6;

function ProjectTile({ project }) {
    const color = getProjectStatusMeta(project.status).color;
    return (
        <span
            aria-hidden
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold uppercase"
            style={{ backgroundColor: `${color}22`, color, boxShadow: `inset 0 0 0 1px ${color}40` }}
        >
            {(project.name || '?').trim().charAt(0)}
        </span>
    );
}

export default function SidebarProjects({ onNavigate, isExpanded = true }) {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const projects = useSelector((state) => state?.workspace?.currentWorkspace?.projects || []);
    const visible = sortByRecentUpdate(projects).slice(0, MAX_PROJECTS);
    const activeId = location.pathname === '/projectsDetail' ? searchParams.get('id') : null;

    return (
        <section aria-label="Recent projects" className="space-y-0.5">
            <div className="relative mb-1 flex h-6 items-center justify-between pl-[15px] pr-2">
                <span aria-hidden className={cn('absolute left-[15px] h-px w-[18px] bg-rail-line transition-opacity duration-200 max-sm:opacity-0', isExpanded ? 'opacity-0' : 'opacity-100')} />
                <p className={cn('font-data text-[11px] font-medium uppercase tracking-[0.08em] text-rail-subtle', railText(isExpanded))}>Projects</p>
                <Link
                    to="/projects"
                    onClick={onNavigate}
                    aria-label="All projects"
                    tabIndex={isExpanded ? 0 : -1}
                    className={cn('rounded-md p-1 text-rail-subtle transition-colors hover:bg-rail-hover hover:text-rail-fg', railText(isExpanded))}
                >
                    <Plus className="h-3.5 w-3.5" />
                </Link>
            </div>

            {visible.length === 0 ? (
                <p className={cn('px-[15px] text-xs text-rail-subtle', railText(isExpanded))}>No projects yet</p>
            ) : (
                <ul className="space-y-0.5">
                    {visible.map((project) => {
                        const isActive = project.id === activeId;
                        return (
                            <li key={project.id}>
                                <Link
                                    to={`/projectsDetail?id=${project.id}&tab=tasks`}
                                    onClick={onNavigate}
                                    title={isExpanded ? undefined : project.name}
                                    className={cn(
                                        'flex h-9 items-center gap-3 rounded-xl px-[14px] text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-rail-accent/50',
                                        isActive ? 'bg-rail-active font-medium text-rail-fg' : 'text-rail-muted hover:bg-rail-hover hover:text-rail-fg'
                                    )}
                                >
                                    <ProjectTile project={project} />
                                    <span className={cn('flex-1 truncate', railText(isExpanded))}>{project.name}</span>
                                    <span className={cn('font-data text-[11px] text-rail-subtle', railText(isExpanded))}>{getProjectProgress(project)}%</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
