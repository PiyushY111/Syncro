import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeftIcon, PlusIcon, SettingsIcon, BarChart3Icon, CalendarIcon, FileStackIcon } from 'lucide-react';
import ProjectAnalytics from '@/components/project/analytics/ProjectAnalytics';
import ProjectSettings from '@/components/project/overview/ProjectSettings';
import CreateTaskDialog from '@/components/task/CreateTaskDialog';
import ProjectCalendar from '@/components/project/calendar/ProjectCalendar';
import ProjectTasks from '@/components/project/tasks/ProjectTasks';
import ProjectKanban from '@/components/project/kanban/ProjectKanban';
import ProjectStatsSummary from '@/components/project/overview/ProjectStatsSummary';

const statusColors = {
    PLANNING: "bg-zinc-200 text-zinc-900 dark:bg-zinc-600 dark:text-zinc-200",
    ACTIVE: "bg-emerald-200 text-emerald-900 dark:bg-emerald-500 dark:text-emerald-900",
    ON_HOLD: "bg-amber-200 text-amber-900 dark:bg-amber-500 dark:text-amber-900",
    COMPLETED: "bg-blue-200 text-blue-900 dark:bg-blue-500 dark:text-blue-900",
    CANCELLED: "bg-red-200 text-red-900 dark:bg-red-500 dark:text-red-900",
};

export default function ProjectDetail() {
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = searchParams.get('tab');
    const id = searchParams.get('id');

    const navigate = useNavigate();
    const projects = useSelector((state) => state?.workspace?.currentWorkspace?.projects || []);

    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [showCreateTask, setShowCreateTask] = useState(false);
    const [activeTab, setActiveTab] = useState(tab || "tasks");
    const [viewMode, setViewMode] = useState("list");

    useEffect(() => {
        if (tab) setActiveTab(tab);
    }, [tab]);

    useEffect(() => {
        if (projects && projects.length > 0) {
            const proj = projects.find((p) => p.id === id);
            setProject(proj);
            setTasks(proj?.tasks || []);
        }
    }, [id, projects]);

    if (!project) {
        return (
            <div className="p-6 text-center text-zinc-900 dark:text-zinc-200">
                <p className="text-3xl md:text-5xl mt-40 mb-10">Project not found</p>
                <button onClick={() => navigate('/projects')} className="mt-4 px-4 py-2 rounded bg-zinc-200 text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600 cursor-pointer" >
                    Back to Projects
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-5 max-w-6xl mx-auto text-zinc-900 dark:text-white">
            {/* Header */}
            <div className="flex max-md:flex-col gap-4 flex-wrap items-start justify-between max-w-6xl text-left">
                <div className="flex items-center gap-4">
                    <button className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 cursor-pointer" onClick={() => navigate('/projects')}>
                        <ArrowLeftIcon className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-medium">{project.name}</h1>
                        <span className={`px-2 py-1 rounded text-xs capitalize ${statusColors[project.status]} font-semibold`} >
                            {project.status.replace("_", " ").toLowerCase()}
                        </span>
                    </div>
                </div>
                <button onClick={() => setShowCreateTask(true)} className="flex items-center gap-2 px-5 py-2 text-sm rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white cursor-pointer font-medium" >
                    <PlusIcon className="size-4" />
                    New Task
                </button>
            </div>

            {/* Info Cards */}
            <ProjectStatsSummary tasks={tasks} project={project} />

            {/* Tabs and Views */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
                <div className="inline-flex flex-wrap max-sm:grid grid-cols-3 gap-2 border border-zinc-200 dark:border-zinc-800 rounded overflow-hidden">
                    {[
                        { key: "tasks", label: "Tasks", icon: FileStackIcon },
                        { key: "calendar", label: "Calendar", icon: CalendarIcon },
                        { key: "analytics", label: "Analytics", icon: BarChart3Icon },
                        { key: "settings", label: "Settings", icon: SettingsIcon },
                    ].map((tabItem) => (
                        <button key={tabItem.key} onClick={() => { setActiveTab(tabItem.key); setSearchParams({ id: id, tab: tabItem.key }) }} className={`flex items-center gap-2 px-4 py-2 text-sm transition-all cursor-pointer ${activeTab === tabItem.key ? "bg-zinc-100 dark:bg-zinc-800/80" : "hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-500"}`} >
                            <tabItem.icon className="size-3.5" />
                            {tabItem.label}
                        </button>
                    ))}
                </div>

                {activeTab === "tasks" && (
                    <div className="inline-flex border border-zinc-200 dark:border-zinc-800 rounded overflow-hidden bg-white dark:bg-zinc-900">
                        <button
                            onClick={() => setViewMode("list")}
                            className={`px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                                viewMode === "list"
                                    ? "bg-zinc-100 dark:bg-zinc-850 text-blue-600 dark:text-blue-400"
                                    : "text-zinc-600 dark:text-zinc-450 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                             }`}
                        >
                            List View
                        </button>
                        <button
                            onClick={() => setViewMode("board")}
                            className={`px-4 py-2 text-xs font-semibold transition-all cursor-pointer border-l border-zinc-250 dark:border-zinc-800 ${
                                viewMode === "board"
                                    ? "bg-zinc-100 dark:bg-zinc-850 text-blue-600 dark:text-blue-400"
                                    : "text-zinc-600 dark:text-zinc-450 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                            }`}
                        >
                            Board View (Kanban)
                        </button>
                    </div>
                )}
            </div>

            <div>
                <div className="mt-6">
                    {activeTab === "tasks" && (
                        <div className="dark:bg-zinc-900/40 rounded max-w-6xl">
                            {viewMode === "list" ? (
                                <ProjectTasks tasks={tasks} project={project} />
                            ) : (
                                <ProjectKanban tasks={tasks} project={project} />
                            )}
                        </div>
                    )}
                    {activeTab === "analytics" && (
                        <div className="dark:bg-zinc-900/40 rounded max-w-6xl">
                            <ProjectAnalytics tasks={tasks} project={project} />
                        </div>
                    )}
                    {activeTab === "calendar" && (
                        <div className="dark:bg-zinc-900/40 rounded max-w-6xl">
                            <ProjectCalendar tasks={tasks} />
                        </div>
                    )}
                    {activeTab === "settings" && (
                        <div className="dark:bg-zinc-900/40 rounded max-w-6xl">
                            <ProjectSettings project={project} />
                        </div>
                    )}
                </div>
            </div>

            {/* Create Task Modal */}
            {showCreateTask && <CreateTaskDialog showCreateTask={showCreateTask} setShowCreateTask={setShowCreateTask} projectId={id} />}
        </div>
    );
}
