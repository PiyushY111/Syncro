import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart as PieChartIcon } from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0];
        return (
            <div className="bg-slate-900/95 dark:bg-zinc-950/95 text-white border border-slate-800 dark:border-zinc-800 rounded-xl p-3 shadow-xl backdrop-blur-md text-xs space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.color }} />
                    <span>{data.name}</span>
                </div>
                <p className="text-slate-300 dark:text-zinc-400">
                    <span className="font-bold text-white text-sm">{data.value}</span> project{data.value !== 1 ? 's' : ''} ({data.payload.percentage}%)
                </p>
            </div>
        );
    }
    return null;
};

export default function StatusDistributionChart({ statusData }) {
    const totalProjects = statusData.reduce((sum, item) => sum + item.value, 0);

    const enrichedData = statusData.map(item => ({
        ...item,
        percentage: totalProjects > 0 ? Math.round((item.value / totalProjects) * 100) : 0,
    }));

    return (
        <Card className="border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-xs flex flex-col justify-between rounded-2xl overflow-hidden">
            <CardHeader className="p-5 border-b border-slate-100 dark:border-zinc-800/60 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                        <PieChartIcon className="h-4 w-4" />
                    </div>
                    <div>
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                            Status Distribution
                        </CardTitle>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                            Current initiative lifecycle breakdown
                        </p>
                    </div>
                </div>
                <Badge variant="outline" className="text-[11px] font-semibold py-1 px-2.5 rounded-lg bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700">
                    {totalProjects} Total
                </Badge>
            </CardHeader>

            <CardContent className="p-5 sm:p-6">

                {enrichedData.length > 0 ? (
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        {/* Donut Chart with Center Counter */}
                        <div className="relative h-[180px] w-[180px] shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={enrichedData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={58}
                                        outerRadius={78}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {enrichedData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">
                                    {totalProjects}
                                </span>
                                <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-zinc-500 tracking-wider">
                                    Projects
                                </span>
                            </div>
                        </div>

                        {/* Interactive Legend Grid */}
                        <div className="flex-1 w-full space-y-2">
                            {enrichedData.map((item) => (
                                <div 
                                    key={item.name} 
                                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50/60 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800/80 text-xs transition-colors hover:bg-slate-100/70 dark:hover:bg-zinc-800/70"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                        <span className="font-medium text-slate-700 dark:text-zinc-300">{item.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900 dark:text-zinc-100">{item.value}</span>
                                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold min-w-[32px] text-right">
                                            {item.percentage}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="h-[180px] flex items-center justify-center">
                        <p className="text-xs text-slate-400 dark:text-zinc-500">No project status data to display</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

