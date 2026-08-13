import { useSelector } from 'react-redux';
import StatusDistributionChart from '@/components/dashboard/StatusDistributionChart';
import ProjectProgressBarChart from '@/components/dashboard/ProjectProgressBarChart';

const STATUS_COLORS = {
    PLANNING: "#94a3b8",   // slate-400
    ACTIVE: "#3b82f6",     // blue-500
    ON_HOLD: "#f59e0b",    // amber-500
    COMPLETED: "#10b981", // emerald-500
    CANCELLED: "#f43f5e", // rose-500
};

export default function DashboardAnalytics() {
    const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace || null);
    const projects = currentWorkspace?.projects || [];

    // 1. Process Status Data
    const statusCounts = projects.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
    }, {});

    const statusData = Object.entries(STATUS_COLORS)
        .map(([status, color]) => ({
            name: status.replace("_", " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
            value: statusCounts[status] || 0,
            color,
        }))
        .filter(item => item.value > 0);

    // 2. Process Progress Data (Top 5 projects by progress/creation with fallback status weights)
    const progressData = projects
        .slice(0, 5)
        .map((p) => {
            const totalTasks = p.tasks?.length || 0;
            const completedTasks = p.tasks?.filter(t => t.status === 'DONE')?.length || 0;
            const computedProgress = totalTasks > 0 
                ? Math.round((completedTasks / totalTasks) * 100) 
                : (p.progress || (p.status === 'COMPLETED' ? 100 : p.status === 'ACTIVE' ? 65 : 30));

            return {
                name: p.name.length > 14 ? p.name.slice(0, 14) + "..." : p.name,
                Progress: computedProgress,
            };
        });

    if (projects.length === 0) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6 text-left">
            <StatusDistributionChart statusData={statusData} />
            <ProjectProgressBarChart progressData={progressData} />
        </div>
    );
}
