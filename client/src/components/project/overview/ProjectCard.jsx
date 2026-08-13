import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, FolderKanban } from 'lucide-react';

const statusBadgeVariant = {
    PLANNING: "outline",
    ACTIVE: "default",
    ON_HOLD: "warning",
    COMPLETED: "success",
    CANCELLED: "destructive",
};

const priorityVariant = {
    HIGH: "destructive",
    MEDIUM: "warning",
    LOW: "secondary",
};

const ProjectCard = ({ project }) => {
    const progress = project.progress || 0;

    return (
        <Link to={`/projectsDetail?id=${project.id}&tab=tasks`} className="block group">
            <Card className="h-full border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 hover:shadow-lg hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 cursor-pointer overflow-hidden relative">
                <CardHeader className="p-5 pb-3 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="p-2 rounded-lg bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shrink-0">
                                <FolderKanban className="h-4 w-4" />
                            </div>
                            <CardTitle className="text-base font-semibold text-slate-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {project.name}
                            </CardTitle>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-slate-400 dark:text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>

                    <CardDescription className="line-clamp-2 text-xs text-slate-500 dark:text-zinc-400 h-9">
                        {project.description || "No description provided."}
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-4">
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800/60">
                        <Badge variant={statusBadgeVariant[project.status] || "outline"} className="text-[10px] font-semibold py-0.5 px-2">
                            {project.status ? project.status.replace("_", " ") : "PLANNING"}
                        </Badge>
                        <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium capitalize">
                            {project.priority ? `${project.priority.toLowerCase()} priority` : "Normal priority"}
                        </span>
                    </div>

                    {/* Progress Indicator */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-medium">
                            <span className="text-slate-500 dark:text-zinc-400">Completion</span>
                            <span className="text-slate-700 dark:text-zinc-300 font-semibold">{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                            <div 
                                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500" 
                                style={{ width: `${progress}%` }} 
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
};

export default ProjectCard;
