import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AnalyticsCharts({ statusData, typeData }) {
    return (
        <div className="grid lg:grid-cols-2 gap-6">
            <div className="not-dark:bg-white dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-300 dark:border-zinc-800 rounded-lg p-6">
                <h2 className="text-zinc-900 dark:text-white mb-4 font-medium">Tasks by Status</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={statusData}>
                        <XAxis dataKey="name" tick={{ fill: "#52525b", fontSize: 12 }} axisLine={{ stroke: "#d4d4d8" }} />
                        <YAxis tick={{ fill: "#52525b", fontSize: 12 }} axisLine={{ stroke: "#d4d4d8" }} />
                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="not-dark:bg-white dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-300 dark:border-zinc-800 rounded-lg p-6">
                <h2 className="text-zinc-900 dark:text-white mb-4 font-medium">Tasks by Type</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                            {typeData.map((entry, i) => (
                                <Cell key={`cell-${entry.name}`} fill={COLORS[i % COLORS.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
