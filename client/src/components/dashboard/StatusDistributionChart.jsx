import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

export default function StatusDistributionChart({ statusData }) {
    return (
        <div className="bg-white dark:bg-zinc-950 dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition duration-200 rounded-lg p-6 flex flex-col text-left">
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
    );
}
