import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart as PieChartIcon } from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0];
        return (
            <div className="bg-slate-900/95 dark:bg-zinc-900/95 text-white border border-slate-700/80 dark:border-zinc-700/80 rounded-xl p-3 shadow-xl backdrop-blur-md text-xs space-y-1">
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

    // Calculate percentage for each entry
    const enrichedData = statusData.map(item => ({
        ...item,
        percentage: totalProjects > 0 ? Math.round((item.value / totalProjects) * 100) : 0,
    }));

    return (
        <Card className="border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 shadow-sm flex flex-col justify-between">
            <CardHeader className="p-5 pb-2 border-b border-slate-100 dark:border-zinc-800/60 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                        <PieChartIcon className="h-4 w-4" />
                    </div>
                    <div>
                        <CardTitle className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                            Project Status Distribution
                        </CardTitle>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                            Breakdown by current project status
                        </p>
                    </div>
                </div>
                <Badge variant="outline" className="text-[11px] font-bold py-0.5 px-2 text-slate-600 dark:text-zinc-300">
                    {totalProjects} Total
                </Badge>
            </CardHeader>

            <CardContent className="p-5 pt-4">
                {enrichedData.length > 0 ? (
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        {/* Donut Chart with Center Text */}
                        <div className="relative h-[200px] w-[200px] shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={enrichedData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={65}
                                        outerRadius={85}
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
                                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 tracking-wider">
                                    Projects
                                </span>
                            </div>
                        </div>

                        {/* Interactive Legend Grid */}
                        <div className="flex-1 w-full space-y-2.5">
                            {enrichedData.map((item) => (
                                <div 
                                    key={item.name} 
                                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50/60 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800 text-xs transition-colors hover:bg-slate-100/80 dark:hover:bg-zinc-800/80"
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
                    <div className="h-[200px] flex items-center justify-center">
                        <p className="text-xs text-slate-400 dark:text-zinc-500">No project status data to display</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
