/**
 * Project details: header card, five-section navigation, and the active section's view.
 */
import { lazy, Suspense, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FolderX } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getUserWorkspaceRole, canCreateTask } from '@/utils/permissions';
import CreateTaskDialog from '@/components/task/CreateTaskDialog';
import ProjectTasks from '@/components/project/tasks/ProjectTasks';
import ProjectHero from '@/components/project/detail/ProjectHero';
import ProjectSectionNav from '@/components/project/detail/ProjectSectionNav';
import { resolveProjectTab } from '@/components/project/detail/projectSections';

// Secondary views load on demand so the default Tasks view opens without charting/calendar code.
const EntityVersionTimeline = lazy(() => import('@/components/audit/EntityVersionTimeline'));
const ProjectAnalytics = lazy(() => import('@/components/project/analytics/ProjectAnalytics'));
const ProjectSettings = lazy(() => import('@/components/project/overview/ProjectSettings'));
const ProjectCalendar = lazy(() => import('@/components/project/calendar/ProjectCalendar'));
const ProjectGantt = lazy(() => import('@/components/project/gantt/ProjectGantt'));
const ProjectMilestones = lazy(() => import('@/components/project/milestones/ProjectMilestones'));
const EpicMapping = lazy(() => import('@/components/project/scrum/epic/EpicMapping'));
const BacklogPlanning = lazy(() => import('@/components/project/scrum/BacklogPlanning'));
const ActiveSprint = lazy(() => import('@/components/project/scrum/ActiveSprint'));
const BurndownAnalytics = lazy(() => import('@/components/project/scrum/BurndownAnalytics'));
const SprintRetro = lazy(() => import('@/components/project/scrum/retro/SprintRetro'));

function ViewFallback() {
    return <div className="sx-glass h-64 animate-pulse rounded-3xl" aria-busy="true" aria-label="Loading" />;
}

function ProjectNotFound() {
    return (
        <div className="sx-glass mx-auto mt-16 flex max-w-md flex-col items-center rounded-3xl px-6 py-14 text-center">
            <span className="sx-tile sx-tile-rose"><FolderX className="h-6 w-6" /></span>
            <h1 className="mt-5 text-xl font-semibold text-slate-900 dark:text-white">Project not found</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">It may have been deleted, or you no longer have access.</p>
            <Link to="/projects" className="mt-6 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong">Back to projects</Link>
        </div>
    );
}

function SectionView({ view, project, tasks, projectId, navigate }) {
    switch (view) {
        case 'tasks': return <ProjectTasks tasks={tasks} project={project} />;
        case 'activesprint': return <ActiveSprint project={project} tasks={tasks} navigate={navigate} />;
        case 'backlog': return <BacklogPlanning project={project} tasks={tasks} />;
        case 'epicmapping': return <EpicMapping project={project} tasks={tasks} />;
        case 'retro': return <SprintRetro project={project} />;
        case 'milestones': return <ProjectMilestones project={project} tasks={tasks} />;
        case 'gantt': return <ProjectGantt tasks={tasks} project={project} />;
        case 'calendar': return <ProjectCalendar tasks={tasks} projectId={projectId} />;
        case 'insights':
            return (
                <div className="space-y-6">
                    <BurndownAnalytics project={project} tasks={tasks} />
                    <ProjectAnalytics tasks={tasks} project={project} />
                </div>
            );
        case 'history':
            return <div className="sx-glass rounded-3xl p-6"><EntityVersionTimeline entityType="PROJECT" entityId={projectId} canRollback /></div>;
        case 'general': return <ProjectSettings project={project} />;
        default: return null;
    }
}

export default function ProjectDetail() {
    const [searchParams, setSearchParams] = useSearchParams();
    const projectId = searchParams.get('id');
    const { section, view } = resolveProjectTab(searchParams.get('tab'));

    const navigate = useNavigate();
    const { user } = useAuth();
    const currentWorkspace = useSelector((state) => state?.workspace?.currentWorkspace);
    const [showCreateTask, setShowCreateTask] = useState(false);

    const project = useMemo(() => (currentWorkspace?.projects || []).find((p) => p.id === projectId), [currentWorkspace, projectId]);
    const tasks = project?.tasks || [];

    if (!project) return <ProjectNotFound />;

    const canCreate = canCreateTask(getUserWorkspaceRole(currentWorkspace, user?.id), project, user?.id, currentWorkspace);
    const selectTab = (tab) => setSearchParams({ id: projectId, tab });

    return (
        <div className="mx-auto w-full max-w-7xl space-y-6 pb-12">
            <ProjectHero project={project} tasks={tasks} canCreate={canCreate} onNewTask={() => setShowCreateTask(true)} />
            <ProjectSectionNav section={section} view={view} onSelect={selectTab} />
            <div key={view} className="sx-rise min-w-0">
                <Suspense fallback={<ViewFallback />}>
                    <SectionView view={view} project={project} tasks={tasks} projectId={projectId} navigate={navigate} />
                </Suspense>
            </div>
            {showCreateTask && <CreateTaskDialog showCreateTask={showCreateTask} setShowCreateTask={setShowCreateTask} projectId={projectId} />}
        </div>
    );
}
