import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Plus, Search, FolderOpen, Filter } from 'lucide-react';
import ProjectCard from '@/components/project/overview/ProjectCard';
import CreateProjectDialog from '@/components/project/dialogs/CreateProjectDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function Projects() {
    const projects = useSelector(
        (state) => state?.workspace?.currentWorkspace?.projects || []
    );

    const [filteredProjects, setFilteredProjects] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [filters, setFilters] = useState({
        status: "ALL",
        priority: "ALL",
    });

    useEffect(() => {
        let filtered = projects;
        if (searchTerm) {
            filtered = filtered.filter((p) => 
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                p.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (filters.status !== "ALL") {
            filtered = filtered.filter((p) => p.status === filters.status);
        }
        if (filters.priority !== "ALL") {
            filtered = filtered.filter((p) => p.priority === filters.priority);
        }
        setFilteredProjects(filtered);
    }, [projects, searchTerm, filters]);

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200/80 dark:border-zinc-800/80">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                        Projects
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
                        Manage, organize, and monitor workspace initiatives and deliverables.
                    </p>
                </div>
                <Button 
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md shadow-blue-500/20 shrink-0 gap-2"
                >
                    <Plus className="h-4 w-4" />
                    <span>New Project</span>
                </Button>
                <CreateProjectDialog isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        value={searchTerm} 
                        className="pl-9 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800" 
                        placeholder="Search projects..." 
                    />
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <select 
                            value={filters.status} 
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })} 
                            className="h-9 px-3 py-1 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 text-xs font-medium focus:ring-2 focus:ring-blue-500/30 outline-none shadow-2xs cursor-pointer" 
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="ACTIVE">Active</option>
                            <option value="PLANNING">Planning</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="ON_HOLD">On Hold</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>

                    <div className="relative">
                        <select 
                            value={filters.priority} 
                            onChange={(e) => setFilters({ ...filters, priority: e.target.value })} 
                            className="h-9 px-3 py-1 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 text-xs font-medium focus:ring-2 focus:ring-blue-500/30 outline-none shadow-2xs cursor-pointer" 
                        >
                            <option value="ALL">All Priorities</option>
                            <option value="HIGH">High Priority</option>
                            <option value="MEDIUM">Medium Priority</option>
                            <option value="LOW">Low Priority</option>
                        </select>
                    </div>

                    {(filters.status !== "ALL" || filters.priority !== "ALL" || searchTerm) && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => { setSearchTerm(""); setFilters({ status: "ALL", priority: "ALL" }); }}
                            className="text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                        >
                            Reset
                        </Button>
                    )}
                </div>
            </div>

            {/* Projects Grid */}
            {filteredProjects.length === 0 ? (
                <Card className="border-dashed border-2 border-slate-200 dark:border-zinc-800">
                    <CardContent className="text-center py-16">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-zinc-800 flex items-center justify-center">
                            <FolderOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-zinc-100 mb-1">
                            No projects found
                        </h3>
                        <p className="text-slate-500 dark:text-zinc-400 mb-6 text-sm max-w-sm mx-auto">
                            {searchTerm || filters.status !== "ALL" || filters.priority !== "ALL" 
                                ? "No projects matched your current search or filter options." 
                                : "Create your first project to organize tasks, assign members, and track progress."}
                        </p>
                        <Button 
                            onClick={() => setIsDialogOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Create Project</span>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            )}
        </div>
    );
}
