import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/95 dark:bg-zinc-950/95 text-white border border-slate-800 dark:border-zinc-800 rounded-xl p-3 shadow-xl backdrop-blur-md text-xs space-y-1">
                <p className="font-semibold text-slate-200">{label}</p>
                <p className="text-blue-400 font-bold text-sm">
                    {payload[0].value}% Completed
                </p>
            </div>
        );
    }
    return null;
};

export default function ProjectProgressBarChart({ progressData }) {
    return (
        <Card className="border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-xs flex flex-col justify-between rounded-2xl overflow-hidden">
            <CardHeader className="p-5 border-b border-slate-100 dark:border-zinc-800/60 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                        <BarChart3 className="h-4 w-4" />
                    </div>
                    <div>
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                            Deliverable Progress
                        </CardTitle>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                            Completion rates across active initiatives
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-6">

                {progressData.length > 0 ? (
                    <div className="h-[180px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={progressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="progressGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.8} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.12} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#94a3b8"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={[0, 100]}
                                    unit="%"
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(148, 163, 184, 0.06)" }} />
                                <Bar 
                                    dataKey="Progress" 
                                    fill="url(#progressGrad)" 
                                    radius={[6, 6, 0, 0]} 
                                    barSize={24} 
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-[180px] flex items-center justify-center">
                        <p className="text-xs text-slate-400 dark:text-zinc-500">No project progress metrics recorded yet</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

