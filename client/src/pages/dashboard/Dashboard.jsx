/**
 * Dashboard: briefing hero, focus queue, week ahead, projects, activity, portfolio mix and notes.
 * This container derives all data once and passes it down; the tiles are presentational.
 */
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAuth } from '@/context/AuthContext';
import CreateProjectDialog from '@/components/project/dialogs/CreateProjectDialog';
import BentoHero from '@/components/dashboard/BentoHero';
import FocusQueue from '@/components/dashboard/FocusQueue';
import WeekAhead from '@/components/dashboard/WeekAhead';
import ProjectCards from '@/components/dashboard/ProjectCards';
import ActivityTimeline from '@/components/dashboard/ActivityTimeline';
import PortfolioMix from '@/components/dashboard/PortfolioMix';
import Scratchpad from '@/components/dashboard/Scratchpad';
import {
    computeWorkspaceStats,
    getFocusGroups,
    getTasksWithProject,
    getWeekAhead,
    isAssignedTo,
    sortByRecentUpdate,
} from '@/components/dashboard/dashboardMetrics';

const MAX_PROJECT_CARDS = 6;
const MAX_ACTIVITY = 7;

function useDashboardData(workspace, user) {
    return useMemo(() => {
        const tasks = getTasksWithProject(workspace);
        const projects = workspace?.projects || [];
        const focus = getFocusGroups(tasks, user);
        return {
            stats: computeWorkspaceStats(workspace, user),
            focus,
            week: getWeekAhead(tasks),
            myDueThisWeek: focus.week.filter((t) => isAssignedTo(t, user)).length,
            projects,
            recentProjects: sortByRecentUpdate(projects).slice(0, MAX_PROJECT_CARDS),
            activity: sortByRecentUpdate(tasks).slice(0, MAX_ACTIVITY),
        };
    }, [workspace, user]);
}

export default function Dashboard() {
    const { user } = useAuth();
    const workspace = useSelector((state) => state?.workspace?.currentWorkspace || null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const data = useDashboardData(workspace, user);

    const firstName = (user?.name || user?.email?.split('@')[0] || 'there').split(' ')[0];
    const openNewProject = () => setIsDialogOpen(true);

    return (
        <div className="mx-auto max-w-[1360px] space-y-5 pb-12 text-left">
            <BentoHero
                userName={firstName}
                workspaceName={workspace?.name}
                stats={data.stats}
                myDueThisWeek={data.myDueThisWeek}
                onNewProject={openNewProject}
            />

            {/* Keyed by workspace so the default tab / selected day reset when switching workspaces. */}
            <div key={workspace?.id} className="grid gap-5 lg:grid-cols-12">
                <FocusQueue groups={data.focus} className="lg:col-span-7" delay={60} />
                <WeekAhead week={data.week} className="lg:col-span-5" delay={100} />
            </div>

            <ProjectCards projects={data.recentProjects} totalCount={data.projects.length} onNewProject={openNewProject} />

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-12">
                <ActivityTimeline tasks={data.activity} className="md:col-span-2 lg:col-span-5" delay={160} />
                <PortfolioMix projects={data.projects} className="lg:col-span-3" delay={200} />
                <Scratchpad className="lg:col-span-4" delay={240} />
            </div>

            <CreateProjectDialog isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
        </div>
    );
}
