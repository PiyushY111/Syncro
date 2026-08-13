import { Plus, Search, CalendarDays, FolderKanban, LayoutDashboard, BarChart3, Clock } from 'lucide-react';
import { useState } from 'react';
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

    const formattedDate = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' 
    });

    const activeProjectsCount = currentWorkspace?.projects?.filter(p => p.status === 'ACTIVE' || p.status === 'PLANNING')?.length || 0;

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-fade-in text-left">
            {/* Clean Professional Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200/80 dark:border-zinc-800/80">
                <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-xs py-0.5 px-2.5 font-medium border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 bg-white dark:bg-zinc-900">
                            <CalendarDays className="h-3.5 w-3.5 mr-1.5 inline text-blue-600 dark:text-blue-400" />
                            {formattedDate}
                        </Badge>
                        {currentWorkspace?.name && (
                            <Badge variant="secondary" className="text-xs py-0.5 px-2.5 font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                                <FolderKanban className="h-3.5 w-3.5 mr-1.5 inline text-blue-600 dark:text-blue-400" />
                                {currentWorkspace.name}
                            </Badge>
                        )}
                        {activeProjectsCount > 0 && (
                            <Badge variant="outline" className="text-xs py-0.5 px-2.5 font-medium border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 inline-block" />
                                {activeProjectsCount} Active Initiatives
                            </Badge>
                        )}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                        Welcome back, {user?.name || user?.email?.split('@')[0] || 'User'}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-zinc-400">
                        Workspace activity overview and key project metrics.
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <Input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search projects..."
                            className="pl-9 h-9 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 text-xs sm:text-sm"
                        />
                    </div>
                    <Button 
                        onClick={() => setIsDialogOpen(true)}
                        className="h-9 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs shrink-0 gap-2 text-xs sm:text-sm"
                    >
                        <Plus className="h-4 w-4" />
                        <span>New Project</span>
                    </Button>
                </div>

                <CreateProjectDialog isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
            </div>

            {/* Metric Stats Grid */}
            <StatsGrid activeFilter={activeFilter} setActiveFilter={setActiveFilter} />

            {/* Main Tabs Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <TabsList className="bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl">
                        <TabsTrigger value="overview" className="gap-2 text-xs font-semibold rounded-lg">
                            <LayoutDashboard className="h-3.5 w-3.5" />
                            <span>Overview & Projects</span>
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="gap-2 text-xs font-semibold rounded-lg">
                            <BarChart3 className="h-3.5 w-3.5" />
                            <span>Analytics & Metrics</span>
                        </TabsTrigger>
                        <TabsTrigger value="activity" className="gap-2 text-xs font-semibold rounded-lg">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Recent Activity</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Overview Tab Content */}
                <TabsContent value="overview" className="space-y-6 mt-0">
                    <DashboardAnalytics />

                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <ProjectOverview activeFilter={activeFilter} searchTerm={searchTerm} />
                            <RecentActivity />
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
                            <RecentActivity />
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
