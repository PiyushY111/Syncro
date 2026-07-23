import { useSelector } from "react-redux";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-8">
            {/* Status Distribution (Pie Chart) */}
            <div className="bg-white dark:bg-zinc-950 dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition duration-200 rounded-lg p-6 flex flex-col">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-6">Project Status Distribution</h3>
                <div className="h-[250px] w-full flex items-center justify-center">
                    {statusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "rgba(30, 41, 59, 0.9)",
                                        border: "none",
                                        borderRadius: "8px",
                                        color: "#fff",
                                        fontSize: "12px",
                                    }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    iconSize={8}
                                    formatter={(value) => (
                                        <span className="text-xs text-gray-600 dark:text-zinc-400">{value}</span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-xs text-gray-400 dark:text-zinc-500">No projects to display status distribution</p>
                    )}
                </div>
            </div>

            {/* Project Progress (Bar Chart) */}
            <div className="bg-white dark:bg-zinc-950 dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition duration-200 rounded-lg p-6 flex flex-col">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-6">Project Progress (%)</h3>
                <div className="h-[250px] w-full">
                    {progressData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={progressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#9ca3af"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#9ca3af"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={[0, 100]}
                                />
                                <Tooltip
                                    cursor={{ fill: "rgba(148, 163, 184, 0.05)" }}
                                    contentStyle={{
                                        backgroundColor: "rgba(30, 41, 59, 0.9)",
                                        border: "none",
                                        borderRadius: "8px",
                                        color: "#fff",
                                        fontSize: "12px",
                                    }}
                                />
                                <Bar dataKey="Progress" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24}>
                                    {progressData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={`url(#progressGrad)`}
                                        />
                                    ))}
                                </Bar>
                                <defs>
                                    <linearGradient id="progressGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.3} />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-xs text-gray-400 dark:text-zinc-500">No project progress to display</p>
                    )}
                </div>
            </div>
        </div>
    );
}
