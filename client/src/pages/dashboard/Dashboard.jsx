import { Plus, Search, CalendarDays } from 'lucide-react';
import { useState } from 'react';
import StatsGrid from '@/components/dashboard/StatsGrid';
import DashboardAnalytics from '@/components/dashboard/DashboardAnalytics';
import ProjectOverview from '@/components/project/overview/ProjectOverview';
import RecentActivity from '@/components/dashboard/RecentActivity';
import TasksSummary from '@/components/task/TasksSummary';
import Scratchpad from '@/components/dashboard/Scratchpad';
import CreateProjectDialog from '@/components/project/dialogs/CreateProjectDialog';
import { useAuth } from '@/context/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    const formattedDate = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' 
    });

    return (
        <div className='max-w-6xl mx-auto space-y-8 pb-12'>
            {/* Header Redesign */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 text-left border-b border-zinc-100 dark:border-zinc-850 pb-6">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1.5">
                        <CalendarDays className="size-3.5" />
                        <span>{formattedDate}</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-955 dark:text-white tracking-tight">
                        Welcome back, {user?.name || user?.email?.split('@')[0] || 'there'}
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                        Here is a summary of your workspace activities and project performance.
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-72">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 size-4" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search projects, tasks, descriptions..."
                            className="pl-9 w-full text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white dark:bg-zinc-950 transition duration-200"
                        />
                    </div>
                    <button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:opacity-95 transition cursor-pointer font-bold shrink-0 shadow-sm shadow-blue-500/20 hover:scale-[1.01] transition-stiff" >
                        <Plus size={16} /> New Project
                    </button>
                </div>

                <CreateProjectDialog isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
            </div>

            <StatsGrid activeFilter={activeFilter} setActiveFilter={setActiveFilter} />

            <DashboardAnalytics />

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <ProjectOverview activeFilter={activeFilter} searchTerm={searchTerm} />
                    <RecentActivity />
                </div>
                <div className="space-y-8">
                    <TasksSummary searchTerm={searchTerm} />
                    <Scratchpad />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
