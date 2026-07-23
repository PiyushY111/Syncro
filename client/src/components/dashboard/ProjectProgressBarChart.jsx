import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';

export default function ProjectProgressBarChart({ progressData }) {
    return (
        <div className="bg-white dark:bg-zinc-950 dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition duration-200 rounded-lg p-6 flex flex-col text-left">
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
    );
}
