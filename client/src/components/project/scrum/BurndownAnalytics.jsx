import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format, eachDayOfInterval, isAfter, startOfDay } from 'date-fns';
import { AreaChart as ChartIcon, TrendingDown, Layers, Activity } from 'lucide-react';

export default function BurndownAnalytics({ project, tasks }) {
    const activeSprint = project?.sprints?.find(s => s.status === 'ACTIVE') || project?.sprints?.find(s => s.status === 'COMPLETED');
    const sprintTasks = useMemo(
        () => (activeSprint ? tasks.filter(t => t.sprintId === activeSprint.id) : []),
        [activeSprint, tasks]
    );

    const chartData = useMemo(() => {
        if (!activeSprint || sprintTasks.length === 0) return [];

        const start = startOfDay(new Date(activeSprint.startDate));
        const end = startOfDay(new Date(activeSprint.endDate));
        const today = startOfDay(new Date());

        // Get all days of the sprint
        const days = eachDayOfInterval({ start, end });
        const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

        return days.map((day, index) => {
            const dayStr = format(day, 'MMM dd');

            // 1. Ideal Burndown
            const idealRemaining = Math.max(0, parseFloat((totalPoints - (totalPoints / (days.length - 1)) * index).toFixed(1)));

            // 2. Actual Remaining (Tasks NOT completed before or on this day)
            let actualRemaining = null;
            if (!isAfter(day, today)) {
                actualRemaining = 0;
                sprintTasks.forEach(task => {
                    const isDone = task.status === 'DONE';
                    const completedDate = task.updatedAt ? startOfDay(new Date(task.updatedAt)) : null;
                    
                    // Task is remaining if it's not completed, or completed after this day
                    if (!isDone || (completedDate && isAfter(completedDate, day))) {
                        actualRemaining += (task.storyPoints || 0);
                    }
                });
            }

            // 3. Burnup Scope & Burnup Completed
            let burnupScope = 0;
            let burnupCompleted = 0;
            
            sprintTasks.forEach(task => {
                const createdDate = task.createdAt ? startOfDay(new Date(task.createdAt)) : start;
                const completedDate = task.updatedAt ? startOfDay(new Date(task.updatedAt)) : null;
                const isDone = task.status === 'DONE';

                // Count in scope if created before or on this day
                if (!isAfter(createdDate, day)) {
                    burnupScope += (task.storyPoints || 0);
                }

                // Count as completed if completed before or on this day
                if (isDone && completedDate && !isAfter(completedDate, day)) {
                    burnupCompleted += (task.storyPoints || 0);
                }
            });

            return {
                day: dayStr,
                "Ideal Burndown": idealRemaining,
                "Actual Burndown": actualRemaining,
                "Total Scope": burnupScope,
                "Completed Points": burnupCompleted
            };
        });
    }, [activeSprint, sprintTasks]);

    if (!activeSprint || sprintTasks.length === 0) {
        return (
            <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-16 text-center text-zinc-500 max-w-4xl mx-auto mt-10">
                <ChartIcon className="size-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-4 animate-pulse" />
                <h3 className="text-lg font-bold text-zinc-750 dark:text-zinc-250">No Sprint Data Found</h3>
                <p className="text-sm text-zinc-400 mt-2 max-w-md mx-auto">Sprint charts require an active or completed sprint containing tasks with assigned story points.</p>
            </div>
        );
    }

    const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const completedPoints = sprintTasks.filter(t => t.status === 'DONE').reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const scopeCreep = chartData.length > 0 ? (chartData[chartData.length - 1]["Total Scope"] - chartData[0]["Total Scope"]) : 0;

    return (
        <div className="space-y-8 text-zinc-900 dark:text-white text-left">
            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-zinc-900/60 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-500">
                        <TrendingDown className="size-6" />
                    </div>
                    <div>
                        <span className="text-[10px] text-zinc-450 uppercase font-bold">Total Points Allocation</span>
                        <h4 className="text-xl font-bold">{totalPoints} Story Points</h4>
                        <p className="text-xs text-zinc-400 mt-0.5">{sprintTasks.length} tasks in Sprint</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900/60 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500">
                        <Activity className="size-6" />
                    </div>
                    <div>
                        <span className="text-[10px] text-zinc-450 uppercase font-bold">Completed points</span>
                        <h4 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{completedPoints} SP Completed</h4>
                        <p className="text-xs text-zinc-400 mt-0.5">{totalPoints - completedPoints} SP remaining</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900/60 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-purple-500/10 text-purple-500">
                        <Layers className="size-6" />
                    </div>
                    <div>
                        <span className="text-[10px] text-zinc-450 uppercase font-bold">Scope Creep</span>
                        <h4 className={`text-xl font-bold ${scopeCreep > 0 ? 'text-amber-500' : ''}`}>+{scopeCreep} SP Added</h4>
                        <p className="text-xs text-zinc-400 mt-0.5">Tasks introduced mid-sprint</p>
                    </div>
                </div>
            </div>

            {/* Charts section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Sprint Burndown Chart */}
                <div className="bg-white dark:bg-zinc-900/60 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div className="mb-4">
                        <h3 className="font-bold text-sm">Sprint Burndown Chart</h3>
                        <p className="text-xs text-zinc-400">Ideal vs. Actual remaining effort in story points.</p>
                    </div>
                    <div className="h-80 w-full text-xs">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" className="dark:stroke-zinc-800" />
                                <XAxis dataKey="day" stroke="#a1a1aa" />
                                <YAxis stroke="#a1a1aa" />
                                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }} />
                                <Legend />
                                <Line type="monotone" dataKey="Ideal Burndown" stroke="#a1a1aa" strokeDasharray="5 5" strokeWidth={2} activeDot={{ r: 4 }} />
                                <Line type="monotone" dataKey="Actual Burndown" stroke="#3b82f6" strokeWidth={3} connectNulls activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Sprint Burnup Chart (Tracks scope creep) */}
                <div className="bg-white dark:bg-zinc-900/60 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div className="mb-4">
                        <h3 className="font-bold text-sm">Sprint Burnup Chart</h3>
                        <p className="text-xs text-zinc-400">Total scope vs. Completed points (reveals scope creep).</p>
                    </div>
                    <div className="h-80 w-full text-xs">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" className="dark:stroke-zinc-800" />
                                <XAxis dataKey="day" stroke="#a1a1aa" />
                                <YAxis stroke="#a1a1aa" />
                                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }} />
                                <Legend />
                                <Area type="monotone" dataKey="Total Scope" stroke="#f59e0b" fill="rgba(245, 158, 11, 0.05)" strokeWidth={2} />
                                <Area type="monotone" dataKey="Completed Points" stroke="#10b981" fill="rgba(16, 185, 129, 0.1)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
