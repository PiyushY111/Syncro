import { FolderOpen, CheckCircle, Users, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function StatsGrid({ activeFilter, setActiveFilter }) {
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
            title: "Total Projects", 
            value: stats.totalProjects,
            badge: `${stats.activeProjects} Active`,
            subtitle: `${activeRate}% active rate`, 
            progress: activeRate,
            progressColor: "bg-blue-600 dark:bg-blue-500", 
            bgColor: "bg-blue-50 dark:bg-blue-950/50", 
            textColor: "text-blue-600 dark:text-blue-400",
            badgeVariant: "default"
        },
        {
            id: "completed", 
            icon: CheckCircle, 
            title: "Completed Projects", 
            value: stats.completedProjects,
            badge: `${completionRate}% Done`,
            subtitle: "Overall completion rate", 
            progress: completionRate,
            progressColor: "bg-emerald-600 dark:bg-emerald-500", 
            bgColor: "bg-emerald-50 dark:bg-emerald-950/50", 
            textColor: "text-emerald-600 dark:text-emerald-400",
            badgeVariant: "success"
        },
        {
            id: "mytasks", 
            icon: Users, 
            title: "My Assigned Tasks", 
            value: stats.myTasks,
            badge: "Assigned",
            subtitle: "Assigned tasks in workspace", 
            progress: stats.myTasks ? 100 : 0,
            progressColor: "bg-indigo-600 dark:bg-indigo-500", 
            bgColor: "bg-indigo-50 dark:bg-indigo-950/50", 
            textColor: "text-indigo-600 dark:text-indigo-400",
            badgeVariant: "secondary"
        },
        {
            id: "overdue", 
            icon: AlertTriangle, 
            title: "Overdue Tasks", 
            value: stats.overdueIssues,
            badge: stats.overdueIssues > 0 ? "Action Required" : "On Track",
            subtitle: `${stats.overdueIssues} tasks past deadline`, 
            progress: stats.overdueIssues ? 100 : 0,
            progressColor: "bg-amber-600 dark:bg-amber-500", 
            bgColor: "bg-amber-50 dark:bg-amber-950/50", 
            textColor: "text-amber-600 dark:text-amber-400",
            badgeVariant: stats.overdueIssues > 0 ? "warning" : "outline"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 my-4">
            {statCards.map((card) => {
                const Icon = card.icon;
                const isActive = activeFilter === card.id;

                return (
                    <Card
                        key={card.id}
                        onClick={() => setActiveFilter(isActive ? "all" : card.id)}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md border ${
                            isActive 
                                ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/10' 
                                : 'border-slate-200/80 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700'
                        }`}
                    >
                        <CardContent className="p-5 flex flex-col justify-between h-full text-left">
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                                        {card.title}
                                    </span>
                                    <div className={`p-2 rounded-xl ${card.bgColor} shrink-0`}>
                                        <Icon className={`h-4 w-4 ${card.textColor}`} />
                                    </div>
                                </div>
                                <div className="flex items-baseline justify-between gap-2 mb-2">
                                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">
                                        {card.value}
                                    </span>
                                    <Badge variant={card.badgeVariant} className="text-[10px] py-0 px-2 font-semibold">
                                        {card.badge}
                                    </Badge>
                                </div>
                            </div>

                            <div className="space-y-2 mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/60">
                                <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-500 ${card.progressColor}`} 
                                        style={{ width: `${card.progress}%` }} 
                                    />
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
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
