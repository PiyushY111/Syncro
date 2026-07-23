import { useSelector } from 'react-redux';
import StatusDistributionChart from '@/components/dashboard/StatusDistributionChart';
import ProjectProgressBarChart from '@/components/dashboard/ProjectProgressBarChart';

const STATUS_COLORS = {
    PLANNING: "#a1a1aa", // zinc-400
    ACTIVE: "#10b981",   // emerald-500
    ON_HOLD: "#f59e0b",  // amber-500
    COMPLETED: "#3b82f6", // blue-500
    CANCELLED: "#ef4444", // red-500
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

    // 2. Process Progress Data (Top 5 projects by progress/creation)
    const progressData = projects
        .slice(0, 5)
        .map((p) => ({
            name: p.name.length > 15 ? p.name.slice(0, 15) + "..." : p.name,
            Progress: p.progress || 0,
        }));

    if (projects.length === 0) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-8 text-left">
            {/* Status Distribution */}
            <StatusDistributionChart statusData={statusData} />

            {/* Project Progress */}
            <ProjectProgressBarChart progressData={progressData} />
        </div>
    );
}
