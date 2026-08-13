import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, AlertTriangle, UserCheck } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const priorityBadgeVariant = {
    HIGH: "destructive",
    MEDIUM: "warning",
    LOW: "secondary",
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
        return task.title?.toLowerCase().includes(term) || (task.description && task.description.toLowerCase().includes(term));
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
            iconColor: "text-emerald-600 dark:text-emerald-400",
            bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
            badgeVariant: "success",
            items: myTasks.slice(0, 3)
        },
        {
            title: "Overdue Tasks",
            count: overdueTasks.length,
            icon: AlertTriangle,
            iconColor: "text-rose-600 dark:text-rose-400",
            bgColor: "bg-rose-50 dark:bg-rose-950/40",
            badgeVariant: overdueTasks.length > 0 ? "destructive" : "outline",
            items: overdueTasks.slice(0, 3)
        },
        {
            title: "In Progress",
            count: inProgressIssues.length,
            icon: Clock,
            iconColor: "text-blue-600 dark:text-blue-400",
            bgColor: "bg-blue-50 dark:bg-blue-950/40",
            badgeVariant: "default",
            items: inProgressIssues.slice(0, 3)
        }
    ];

    return (
        <div className="space-y-4">
            {summaryCards.map((card) => (
                <Card key={card.title} className="border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 shadow-sm overflow-hidden">
                    <CardHeader className="p-4 border-b border-slate-100 dark:border-zinc-800/60 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${card.bgColor}`}>
                                <card.icon className={`h-4 w-4 ${card.iconColor}`} />
                            </div>
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                                {card.title}
                            </CardTitle>
                        </div>
                        <Badge variant={card.badgeVariant} className="text-[11px] font-bold py-0.5 px-2">
                            {card.count}
                        </Badge>
                    </CardHeader>

                    <CardContent className="p-3">
                        {card.items.length === 0 ? (
                            <p className="text-xs text-slate-400 dark:text-zinc-500 text-center py-4">
                                No {card.title.toLowerCase()} found
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {card.items.map((issue) => (
                                    <div 
                                        key={issue.id} 
                                        onClick={() => navigate(`/taskDetails?projectId=${issue.projectId}&taskId=${issue.id}`)} 
                                        className="p-3 rounded-lg bg-slate-50/60 dark:bg-zinc-800/40 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer border border-slate-100 dark:border-zinc-800/60 flex items-center justify-between gap-3"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                                                {issue.title}
                                            </h4>
                                            <p className="text-[10px] text-slate-500 dark:text-zinc-400 capitalize mt-0.5">
                                                {issue.type ? issue.type.toLowerCase() : 'task'}
                                            </p>
                                        </div>
                                        <Badge variant={priorityBadgeVariant[issue.priority] || "outline"} className="text-[9px] py-0 px-1.5 font-medium shrink-0">
                                            {issue.priority ? issue.priority.toLowerCase() : 'normal'}
                                        </Badge>
                                    </div>
                                ))}

                                {card.count > 3 && (
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => navigate(`/projectsDetail?id=${card.items[0]?.projectId}&tab=tasks`)} 
                                        className="w-full text-xs text-slate-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 mt-1 h-8"
                                    >
                                        <span>View {card.count - 3} more</span>
                                        <ArrowRight className="h-3 w-3 ml-1.5" />
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
