import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Users, FolderOpen, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';
import CreateProjectDialog from '@/components/project/dialogs/CreateProjectDialog';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

const ProjectOverview = ({ activeFilter, searchTerm }) => {
    const currentWorkspace = useSelector((state) => state?.workspace?.currentWorkspace || null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [projects, setProjects] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        let list = currentWorkspace?.projects || [];
        if (activeFilter === "completed") list = list.filter(p => p.status === "COMPLETED");
        else if (activeFilter === "mytasks") list = list.filter(p => p.tasks?.some(t => t.assigneeId === user?.id || t.assignee?.email === user?.email));
        else if (activeFilter === "overdue") list = list.filter(p => p.tasks?.some(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "DONE"));

        if (searchTerm?.trim()) {
            const term = searchTerm.toLowerCase().trim();
            list = list.filter(p => p.name.toLowerCase().includes(term) || (p.description && p.description.toLowerCase().includes(term)));
        }
        setProjects(list);
    }, [currentWorkspace, activeFilter, searchTerm, user]);

    if (!currentWorkspace) return null;

    return (
        <Card className="border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 shadow-sm overflow-hidden text-left">
            <CardHeader className="p-5 border-b border-slate-100 dark:border-zinc-800/60 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                        Project Initiatives
                    </CardTitle>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                        Active projects and completion progress in {currentWorkspace.name}
                    </p>
                </div>
                <Link to="/projects">
                    <Button variant="ghost" size="sm" className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 gap-1.5 h-8">
                        <span>View all</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                </Link>
            </CardHeader>

            <CardContent className="p-5">
                {projects.length === 0 ? (
                    <div className="py-12 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                            <FolderOpen className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">No matching projects found</h3>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Try adjusting your active filter or create a new project.</p>
                        </div>
                        <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 text-white size-sm gap-1.5 mt-2">
                            Create Project
                        </Button>
                        <CreateProjectDialog isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {projects.slice(0, 4).map((project) => {
                            const progress = project.progress || 0;

                            return (
                                <Link 
                                    key={project.id} 
                                    to={`/projectsDetail?id=${project.id}&tab=tasks`} 
                                    className="block group"
                                >
                                    <div className="p-4 rounded-xl border border-slate-200/70 dark:border-zinc-800/70 bg-slate-50/40 dark:bg-zinc-900/40 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:bg-white dark:hover:bg-zinc-900 hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full space-y-3">
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <Badge variant={statusBadgeVariant[project.status] || "outline"} className="text-[10px] py-0.5 px-2 font-semibold">
                                                    {project.status ? project.status.replace('_', ' ') : 'PLANNING'}
                                                </Badge>
                                                <div className="flex items-center gap-1.5">
                                                    <Badge variant={priorityVariant[project.priority] || "outline"} className="text-[9px] py-0 px-1.5 font-medium uppercase">
                                                        {project.priority ? project.priority.toLowerCase() : 'medium'}
                                                    </Badge>
                                                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </div>

                                            <h3 className="font-semibold text-slate-900 dark:text-zinc-100 text-sm line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {project.name}
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                                                {project.description || 'No description provided.'}
                                            </p>
                                        </div>

                                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800/60">
                                            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex items-center gap-1 font-medium">
                                                        <Users className="h-3 w-3 text-slate-400" /> {project.members?.length || 0}
                                                    </span>
                                                    {project.end_date && (
                                                        <span className="flex items-center gap-1 font-medium">
                                                            <Calendar className="h-3 w-3 text-slate-400" /> {format(new Date(project.end_date), "MMM d")}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="font-semibold text-slate-800 dark:text-zinc-200">{progress}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500" 
                                                    style={{ width: `${progress}%` }} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ProjectOverview;
