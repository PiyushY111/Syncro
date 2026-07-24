import { FolderOpen, CheckCircle, Users, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAuth } from '@/context/AuthContext';

export default function StatsGrid({ activeFilter, setActiveFilter }) {
    const { user } = useAuth();
    const currentWorkspace = useSelector((state) => state?.workspace?.currentWorkspace || null);

    const [stats, setStats] = useState({
        totalProjects: 0, activeProjects: 0, completedProjects: 0, myTasks: 0, overdueIssues: 0
    });

    useEffect(() => {
        if (currentWorkspace) {
            const projects = currentWorkspace.projects;
            const completed = projects.filter(p => p.status === "COMPLETED").length;
            const active = projects.filter(p => p.status !== "CANCELLED" && p.status !== "COMPLETED").length;
            const myT = projects.reduce((acc, p) => acc + p.tasks.filter(t => t.assigneeId === user?.id || t.assignee?.email === user?.email).length, 0);
            const overdue = projects.reduce((acc, p) => acc + p.tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "DONE").length, 0);
            setStats({ totalProjects: projects.length, activeProjects: active, completedProjects: completed, myTasks: myT, overdueIssues: overdue });
        }
    }, [currentWorkspace, user]);

    const completionRate = stats.totalProjects ? Math.round((stats.completedProjects / stats.totalProjects) * 100) : 0;
    const activeRate = stats.totalProjects ? Math.round((stats.activeProjects / stats.totalProjects) * 100) : 0;

    const statCards = [
        {
            id: "all", icon: FolderOpen, title: "Total Projects", value: stats.totalProjects,
            subtitle: `${stats.activeProjects} active projects`, progress: activeRate,
            progressColor: "bg-blue-500", bgColor: "bg-blue-500/10", textColor: "text-blue-500"
        },
        {
            id: "completed", icon: CheckCircle, title: "Completed Projects", value: stats.completedProjects,
            subtitle: `${completionRate}% completion rate`, progress: completionRate,
            progressColor: "bg-emerald-500", bgColor: "bg-emerald-500/10", textColor: "text-emerald-500"
        },
        {
            id: "mytasks", icon: Users, title: "My Tasks", value: stats.myTasks,
            subtitle: "tasks assigned to me", progress: stats.myTasks ? 100 : 0,
            progressColor: "bg-purple-500", bgColor: "bg-purple-500/10", textColor: "text-purple-500"
        },
        {
            id: "overdue", icon: AlertTriangle, title: "Overdue Tasks", value: stats.overdueIssues,
            subtitle: `${stats.overdueIssues} tasks need attention`, progress: stats.overdueIssues ? 100 : 0,
            progressColor: "bg-amber-500", bgColor: "bg-amber-500/10", textColor: "text-amber-500"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-9">
            {statCards.map((card, i) => {
                const Icon = card.icon;
                const isActive = activeFilter === card.id;
                return (
                    <div 
                        key={i} 
                        onClick={() => setActiveFilter(isActive ? "all" : card.id)}
                        className={`bg-white dark:bg-zinc-950 dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border transition-all duration-300 rounded-2xl cursor-pointer p-5 text-left hover:scale-[1.01] hover:shadow-md relative overflow-hidden group ${
                            isActive 
                                ? 'border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/10' 
                                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider mb-1">
                                    {card.title}
                                </p>
                                <p className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                                    {card.value}
                                </p>
                            </div>
                            <div className={`p-2.5 rounded-xl ${card.bgColor} transition-colors group-hover:scale-105 duration-300`}>
                                <Icon size={18} className={card.textColor} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="w-full bg-zinc-100 dark:bg-zinc-850 rounded-full h-1.5 overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-500 ${card.progressColor}`} style={{ width: `${card.progress}%` }} />
                            </div>
                            <p className="text-[11px] font-medium text-zinc-450 dark:text-zinc-500 truncate">
                                {card.subtitle}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
