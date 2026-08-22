import { Plus, Search, CalendarDays, FolderKanban, LayoutDashboard, BarChart3, Clock, X, Command } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatsGrid from '@/components/dashboard/StatsGrid';
import DashboardAnalytics from '@/components/dashboard/DashboardAnalytics';
import ProjectOverview from '@/components/project/overview/ProjectOverview';
import RecentActivity from '@/components/dashboard/RecentActivity';
import TasksSummary from '@/components/task/TasksSummary';
import Scratchpad from '@/components/dashboard/Scratchpad';
import CreateProjectDialog from '@/components/project/dialogs/CreateProjectDialog';
import { useAuth } from '@/context/AuthContext';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const currentWorkspace = useSelector((state) => state?.workspace?.currentWorkspace);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("overview");

    const searchInputRef = useRef(null);

    // Keyboard shortcut handler for ⌘K / Ctrl+K / '/' and Esc
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
                setSearchTerm("");
                searchInputRef.current?.blur();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const currentHour = new Date().getHours();
    const timeGreeting = currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";

    const formattedDate = new Date().toLocaleDateString('en-US', { 
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
    });

    const activeProjectsCount = currentWorkspace?.projects?.filter(p => p.status === 'ACTIVE' || p.status === 'PLANNING')?.length || 0;

    return (
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-12 animate-fade-in text-left">
            {/* Clean Professional Hero Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 pb-5 border-b border-slate-200/80 dark:border-zinc-800/80">
                <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[11px] py-0.5 px-2.5 font-medium border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 shadow-2xs">
                            <CalendarDays className="h-3 w-3 mr-1.5 inline text-blue-600 dark:text-blue-400" />
                            {formattedDate}
                        </Badge>
                        {currentWorkspace?.name && (
                            <Badge variant="outline" className="text-[11px] py-0.5 px-2.5 font-medium bg-slate-100/70 dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700">
                                <FolderKanban className="h-3 w-3 mr-1.5 inline text-indigo-600 dark:text-indigo-400" />
                                {currentWorkspace.name}
                            </Badge>
                        )}
                        {activeProjectsCount > 0 && (
                            <Badge variant="outline" className="text-[11px] py-0.5 px-2.5 font-medium border-emerald-200/60 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 inline-block animate-pulse" />
                                {activeProjectsCount} Active Initiatives
                            </Badge>
                        )}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100">
                        {timeGreeting}, {user?.name || user?.email?.split('@')[0] || 'User'}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
                        Workspace activity overview, initiative tracking, and team deliverables.
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <Button 
                        onClick={() => setIsDialogOpen(true)}
                        className="h-9 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs shrink-0 gap-1.5 text-xs px-4"
                    >
                        <Plus className="h-4 w-4" />
                        <span>New Project</span>
                    </Button>
                </div>

                <CreateProjectDialog isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
            </div>

            {/* Metric Stats Grid */}
            <StatsGrid />


            {/* Main Segment Tabs Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-zinc-800/60 pb-3">
                    <TabsList className="bg-slate-100/80 dark:bg-zinc-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-zinc-800">
                        <TabsTrigger value="overview" className="gap-2 text-xs font-semibold rounded-lg px-3.5 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs">
                            <LayoutDashboard className="h-3.5 w-3.5" />
                            <span>Overview</span>
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="gap-2 text-xs font-semibold rounded-lg px-3.5 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs">
                            <BarChart3 className="h-3.5 w-3.5" />
                            <span>Analytics</span>
                        </TabsTrigger>
                        <TabsTrigger value="activity" className="gap-2 text-xs font-semibold rounded-lg px-3.5 py-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Activity</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Overview Tab Content */}
                <TabsContent value="overview" className="space-y-6 mt-0">
                    <DashboardAnalytics />

                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <ProjectOverview activeFilter={activeFilter} searchTerm={searchTerm} />
                            <RecentActivity searchTerm={searchTerm} />
                        </div>
                        <div className="space-y-6">
                            <TasksSummary searchTerm={searchTerm} />
                            <Scratchpad />
                        </div>
                    </div>
                </TabsContent>

                {/* Analytics Tab Content */}
                <TabsContent value="analytics" className="space-y-6 mt-0">
                    <DashboardAnalytics />
                    <div className="grid lg:grid-cols-2 gap-6">
                        <ProjectOverview activeFilter={activeFilter} searchTerm={searchTerm} />
                        <TasksSummary searchTerm={searchTerm} />
                    </div>
                </TabsContent>

                {/* Activity Tab Content */}
                <TabsContent value="activity" className="space-y-6 mt-0">
                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <RecentActivity searchTerm={searchTerm} />
                        </div>
                        <div>
                            <Scratchpad />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Dashboard;


