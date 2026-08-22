import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, AlertTriangle, UserCheck, ListCheck } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const priorityBadgeVariant = {
    HIGH: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40",
    MEDIUM: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40",
    LOW: "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700",
};

export default function TasksSummary({ searchTerm }) {
    const navigate = useNavigate();
    const { currentWorkspace } = useSelector((state) => state.workspace);
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        if (currentWorkspace) {
            setTasks((currentWorkspace.projects || []).flatMap((project) => project.tasks || []));
        }
    }, [currentWorkspace]);

    const filteredTasks = tasks.filter(task => {
        if (!searchTerm?.trim()) return true;
        const term = searchTerm.toLowerCase().trim();
        return (
            task.title?.toLowerCase().includes(term) || 
            (task.description && task.description.toLowerCase().includes(term)) ||
            (task.type && task.type.toLowerCase().includes(term)) ||
            (task.priority && task.priority.toLowerCase().includes(term)) ||
            (task.status && task.status.toLowerCase().includes(term))
        );
    });


    const myTasks = filteredTasks.filter((task) => {
        const assigneeId = task?.assigneeId || task?.assignee?.id;
        return assigneeId && user?.id && assigneeId === user.id;
    });
    const overdueTasks = filteredTasks.filter((task) => task.due_date && new Date(task.due_date) < new Date() && task.status !== 'DONE');
    const inProgressIssues = filteredTasks.filter((task) => task.status === 'IN_PROGRESS');

    const summaryCards = [
        {
            title: "My Assigned Tasks",
            count: myTasks.length,
            icon: UserCheck,
            iconColor: "text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40",
            bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
            badgeClass: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40",
            items: myTasks.slice(0, 3)
        },
        {
            title: "Overdue Items",
            count: overdueTasks.length,
            icon: AlertTriangle,
            iconColor: "text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40",
            bgColor: "bg-rose-50 dark:bg-rose-950/40",
            badgeClass: overdueTasks.length > 0 
                ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40" 
                : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700",
            items: overdueTasks.slice(0, 3)
        },
        {
            title: "In Progress",
            count: inProgressIssues.length,
            icon: Clock,
            iconColor: "text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40",
            bgColor: "bg-blue-50 dark:bg-blue-950/40",
            badgeClass: "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/40",
            items: inProgressIssues.slice(0, 3)
        }
    ];

    return (
        <div className="space-y-4">
            {summaryCards.map((card) => (
                <Card key={card.title} className="border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-xs rounded-2xl overflow-hidden text-left">
                    <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800/60 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${card.bgColor} ${card.iconColor}`}>
                                <card.icon className="h-4 w-4" />
                            </div>
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                                {card.title}
                            </CardTitle>
                        </div>
                        <Badge variant="outline" className={`text-[11px] font-semibold py-0.5 px-2.5 rounded-lg border ${card.badgeClass}`}>
                            {card.count}
                        </Badge>
                    </CardHeader>

                    <CardContent className="p-4 sm:p-5">

                        {card.items.length === 0 ? (
                            <p className="text-[11px] text-slate-400 dark:text-zinc-500 text-center py-3">
                                No {card.title.toLowerCase()} recorded
                            </p>
                        ) : (
                            <div className="space-y-1.5">
                                {card.items.map((issue) => (
                                    <div 
                                        key={issue.id} 
                                        onClick={() => navigate(`/taskDetails?projectId=${issue.projectId}&taskId=${issue.id}`)} 
                                        className="p-2.5 rounded-lg bg-slate-50/60 dark:bg-zinc-800/40 hover:bg-slate-100/80 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer border border-slate-100 dark:border-zinc-800/60 flex items-center justify-between gap-2.5 group"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {issue.title}
                                            </h4>
                                            <p className="text-[10px] text-slate-400 dark:text-zinc-500 capitalize mt-0.5">
                                                {issue.type ? issue.type.toLowerCase() : 'task'}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className={`text-[9px] py-0 px-1.5 font-medium shrink-0 border ${priorityBadgeVariant[issue.priority] || priorityBadgeVariant.LOW}`}>
                                            {issue.priority ? issue.priority.toLowerCase() : 'normal'}
                                        </Badge>
                                    </div>
                                ))}

                                {card.count > 3 && (
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => navigate(`/projectsDetail?id=${card.items[0]?.projectId}&tab=tasks`)} 
                                        className="w-full text-xs text-slate-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 mt-1 h-7 font-medium"
                                    >
                                        <span>View {card.count - 3} more</span>
                                        <ArrowRight className="h-3 w-3 ml-1" />
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

