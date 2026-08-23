/**
 * Dashboard Metric Stats Grid Component
 */
import { FolderOpen, CheckCircle2, UserCheck, AlertTriangle } from 'lucide-react';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';


export default function StatsGrid() {
    const { user } = useAuth();
    const currentWorkspace = useSelector((state) => state?.workspace?.currentWorkspace || null);

    const [stats, setStats] = useState({
        totalProjects: 0, activeProjects: 0, completedProjects: 0, myTasks: 0, overdueIssues: 0
    });

    useEffect(() => {
        if (currentWorkspace) {
            const projects = currentWorkspace.projects || [];
            const completed = projects.filter(p => p.status === "COMPLETED").length;
            const active = projects.filter(p => p.status !== "CANCELLED" && p.status !== "COMPLETED").length;
            const myT = projects.reduce((acc, p) => acc + (p.tasks || []).filter(t => t.assigneeId === user?.id || t.assignee?.email === user?.email).length, 0);
            const overdue = projects.reduce((acc, p) => acc + (p.tasks || []).filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "DONE").length, 0);
            setStats({ totalProjects: projects.length, activeProjects: active, completedProjects: completed, myTasks: myT, overdueIssues: overdue });
        }
    }, [currentWorkspace, user]);

    const completionRate = stats.totalProjects ? Math.round((stats.completedProjects / stats.totalProjects) * 100) : 0;
    const activeRate = stats.totalProjects ? Math.round((stats.activeProjects / stats.totalProjects) * 100) : 0;

    const statCards = [
        {
            id: "all", 
            icon: FolderOpen, 
            title: "Total Initiatives", 
            value: stats.totalProjects,
            badge: `${stats.activeProjects} Active`,
            subtitle: `${activeRate}% active rate`, 
            progress: activeRate,
            accentColor: "bg-blue-600",
            iconBg: "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50", 
            badgeClass: "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60",
        },
        {
            id: "completed", 
            icon: CheckCircle2, 
            title: "Completed Projects", 
            value: stats.completedProjects,
            badge: `${completionRate}% Done`,
            subtitle: "Overall delivery rate", 
            progress: completionRate,
            accentColor: "bg-emerald-500",
            iconBg: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50", 
            badgeClass: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60",
        },
        {
            id: "mytasks", 
            icon: UserCheck, 
            title: "My Assigned Tasks", 
            value: stats.myTasks,
            badge: "Personal Focus",
            subtitle: "Action items assigned to you", 
            progress: stats.myTasks ? 100 : 0,
            accentColor: "bg-violet-600",
            iconBg: "bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-900/50", 
            badgeClass: "bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-violet-200/80 dark:border-violet-800/60",
        },
        {
            id: "overdue", 
            icon: AlertTriangle, 
            title: "Overdue Items", 
            value: stats.overdueIssues,
            badge: stats.overdueIssues > 0 ? "Needs Attention" : "On Track",
            subtitle: `${stats.overdueIssues} tasks past target date`, 
            progress: stats.overdueIssues ? 100 : 0,
            accentColor: stats.overdueIssues > 0 ? "bg-rose-600" : "bg-slate-400",
            iconBg: stats.overdueIssues > 0 
                ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50" 
                : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700", 
            badgeClass: stats.overdueIssues > 0 
                ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60" 
                : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700",
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-5 text-left">
            {statCards.map((card) => {
                const Icon = card.icon;

                return (
                    <Card
                        key={card.id}
                        className="rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-2xs select-none"
                    >
                        <CardContent className="p-4 sm:p-5 flex flex-col justify-between space-y-3.5">
                            {/* Top Header: Icon & Status Badge */}
                            <div className="flex items-center justify-between gap-2">
                                <div className={`p-2 rounded-xl border ${card.iconBg} shrink-0`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <Badge variant="outline" className={`text-[11px] py-0.5 px-2.5 font-semibold rounded-lg border ${card.badgeClass}`}>
                                    {card.badge}
                                </Badge>
                            </div>

                            {/* Middle: Big Stat & Title */}
                            <div>
                                <div className="text-3xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight leading-none">
                                    {card.value}
                                </div>
                                <h3 className="text-xs font-semibold text-slate-500 dark:text-zinc-400 tracking-tight mt-1.5">
                                    {card.title}
                                </h3>
                            </div>

                            {/* Bottom: Micro Progress Bar & Subtitle */}
                            <div className="space-y-1.5 pt-1">
                                <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-1 overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${card.accentColor} transition-all duration-500`} 
                                        style={{ width: `${card.progress}%` }} 
                                    />
                                </div>
                                <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium truncate">
                                    {card.subtitle}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}




