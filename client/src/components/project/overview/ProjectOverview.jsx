import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Users, FolderOpen, ArrowUpRight, Plus, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';
import CreateProjectDialog from '@/components/project/dialogs/CreateProjectDialog';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const statusBadgeVariant = {
    PLANNING: "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700",
    ACTIVE: "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/40",
    ON_HOLD: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40",
    COMPLETED: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40",
    CANCELLED: "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40",
};

const priorityVariant = {
    HIGH: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40",
    MEDIUM: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40",
    LOW: "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700",
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
        <Card className="border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-xs rounded-2xl overflow-hidden text-left">
            <CardHeader className="p-5 border-b border-slate-100 dark:border-zinc-800/60 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                        <FolderOpen className="h-4 w-4" />
                    </div>
                    <div>
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                            Active Initiatives
                        </CardTitle>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                            Core projects and progress status in {currentWorkspace.name}
                        </p>
                    </div>
                </div>
                <Link to="/projects">
                    <Button variant="ghost" size="sm" className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 gap-1 h-8 px-2.5 font-semibold">
                        <span>View All</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                </Link>
            </CardHeader>

            <CardContent className="p-5 sm:p-6">

                {projects.length === 0 ? (
                    <div className="py-10 text-center space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 flex items-center justify-center mx-auto border border-slate-200 dark:border-zinc-700">
                            <FolderOpen className="h-5 w-5" />
                        </div>
                        <div className="space-y-1 max-w-xs mx-auto">
                            <h3 className="text-xs font-semibold text-slate-800 dark:text-zinc-200">No matching projects found</h3>
                            <p className="text-[11px] text-slate-400 dark:text-zinc-500">Adjust your active filter or launch a new initiative.</p>
                        </div>
                        <Button 
                            onClick={() => setIsDialogOpen(true)} 
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 gap-1.5 font-medium shadow-xs"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Create Initiative</span>
                        </Button>
                        <CreateProjectDialog isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {projects.slice(0, 4).map((project) => {
                            const progress = project.progress || 0;

                            return (
                                <Link 
                                    key={project.id} 
                                    to={`/projectsDetail?id=${project.id}&tab=tasks`} 
                                    className="block group"
                                >
                                    <div className="p-3.5 rounded-xl border border-slate-200/70 dark:border-zinc-800/70 bg-slate-50/40 dark:bg-zinc-900/40 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:bg-white dark:hover:bg-zinc-900 hover:shadow-xs transition-all duration-200 flex flex-col justify-between h-full space-y-3">
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <Badge variant="outline" className={`text-[10px] py-0 px-2 font-semibold border ${statusBadgeVariant[project.status] || statusBadgeVariant.PLANNING}`}>
                                                    {project.status ? project.status.replace('_', ' ') : 'PLANNING'}
                                                </Badge>
                                                <div className="flex items-center gap-1.5">
                                                    <Badge variant="outline" className={`text-[9px] py-0 px-1.5 font-medium uppercase border ${priorityVariant[project.priority] || priorityVariant.MEDIUM}`}>
                                                        {project.priority ? project.priority.toLowerCase() : 'medium'}
                                                    </Badge>
                                                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </div>

                                            <h3 className="font-semibold text-slate-900 dark:text-zinc-100 text-xs line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {project.name}
                                            </h3>
                                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                                                {project.description || 'No detailed description provided.'}
                                            </p>
                                        </div>

                                        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-zinc-800/60">
                                            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex items-center gap-1 font-medium text-[11px]">
                                                        <Users className="h-3 w-3 text-slate-400 dark:text-zinc-500" /> {project.members?.length || 0}
                                                    </span>
                                                    {project.end_date && (
                                                        <span className="flex items-center gap-1 font-medium text-[11px]">
                                                            <Calendar className="h-3 w-3 text-slate-400 dark:text-zinc-500" /> {format(new Date(project.end_date), "MMM d")}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="font-bold text-slate-800 dark:text-zinc-200 text-[11px]">{progress}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-zinc-800 rounded-full h-1 overflow-hidden">
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

