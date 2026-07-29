import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SettingsIcon, BarChart3Icon, CalendarIcon, FileStackIcon, WorkflowIcon, FlagIcon, History as HistoryIcon, Presentation, Play, MessageSquare, Layers, Kanban } from 'lucide-react';
import EntityVersionTimeline from '@/components/audit/EntityVersionTimeline';
import ProjectAnalytics from '@/components/project/analytics/ProjectAnalytics';
import ProjectSettings from '@/components/project/overview/ProjectSettings';
import CreateTaskDialog from '@/components/task/CreateTaskDialog';
import ProjectCalendar from '@/components/project/calendar/ProjectCalendar';
import ProjectTasks from '@/components/project/tasks/ProjectTasks';
import ProjectKanban from '@/components/project/kanban/ProjectKanban';
import ProjectStatsSummary from '@/components/project/overview/ProjectStatsSummary';
import ProjectGantt from '@/components/project/gantt/ProjectGantt';
import ProjectMilestones from '@/components/project/milestones/ProjectMilestones';
import ProjectHeader from './ProjectHeader';
import WhiteboardView from '@/components/project/whiteboardView/WhiteboardView';
import EpicMapping from '@/components/project/scrum/EpicMapping';
import BacklogPlanning from '@/components/project/scrum/BacklogPlanning';
import ActiveSprint from '@/components/project/scrum/ActiveSprint';
import BurndownAnalytics from '@/components/project/scrum/BurndownAnalytics';
import SprintRetro from '@/components/project/scrum/SprintRetro';

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
                <button onClick={() => navigate('/projects')} className="mt-4 px-4 py-2 rounded bg-zinc-200 text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-white cursor-pointer">
                    Back to Projects
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 items-start w-full text-zinc-900 dark:text-white">
            {/* Vertical Hover-Expanding Sidebar */}
            <div className="w-full lg:w-16 lg:hover:w-60 group flex flex-row lg:flex-col gap-1.5 p-2 bg-white dark:bg-zinc-900/60 border border-zinc-250 dark:border-zinc-800 rounded-2xl shadow-xs transition-all duration-300 ease-in-out shrink-0 overflow-x-auto lg:overflow-hidden lg:h-[600px] lg:sticky lg:top-24 z-10 no-scrollbar lg:-ml-6 xl:-ml-12 lg:self-start">
                {[
                    { key: "tasks", label: "Tasks", icon: FileStackIcon },
                    { key: "backlog", label: "Backlog Planning", icon: Layers },
                    { key: "activesprint", label: "Active Sprint", icon: Play },
                    { key: "epicmapping", label: "Epic Mapping", icon: Kanban },
                    { key: "retro", label: "Retrospective", icon: MessageSquare },
                    { key: "milestones", label: "Milestones", icon: FlagIcon },
                    { key: "gantt", label: "Gantt Chart", icon: WorkflowIcon },
                    { key: "calendar", label: "Calendar", icon: CalendarIcon },
                    { key: "analytics", label: "Analytics", icon: BarChart3Icon },
                    { key: "history", label: "Version History", icon: HistoryIcon },
                    { key: "settings", label: "Settings", icon: SettingsIcon },
                ].map((tabItem) => {
                    const isActive = activeTab === tabItem.key;
                    return (
                        <button
                            key={tabItem.key}
                            onClick={() => { setActiveTab(tabItem.key); setSearchParams({ id: id, tab: tabItem.key }) }}
                            className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm transition-all cursor-pointer whitespace-nowrap lg:w-full text-left font-semibold ${isActive ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400"}`}
                        >
                            <tabItem.icon className="size-5 shrink-0" />
                            <span className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 lg:overflow-hidden lg:max-w-0 lg:group-hover:max-w-xs">
                                {tabItem.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0 w-full space-y-6 lg:self-start">
                <ProjectHeader project={project} navigate={navigate} setShowCreateTask={setShowCreateTask} />
                <ProjectStatsSummary tasks={tasks} project={project} />

                {activeTab === "tasks" && (
                    <div className="flex justify-end">
                        <div className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-250 dark:border-zinc-800 p-1 rounded-full shadow-xs">
                            <button 
                                onClick={() => setViewMode("list")} 
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                                    viewMode === "list" 
                                        ? "bg-white dark:bg-zinc-950 text-blue-600 dark:text-blue-400 shadow-xs border border-zinc-200/40 dark:border-zinc-850" 
                                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200"
                                }`}
                            >
                                <span className={`size-2 rounded-full transition-all duration-250 ${viewMode === "list" ? "bg-blue-500 shadow-sm shadow-blue-500/50" : "bg-zinc-400 dark:bg-zinc-600"}`} />
                                List
                            </button>
                            <button 
                                onClick={() => setViewMode("board")} 
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                                    viewMode === "board" 
                                        ? "bg-white dark:bg-zinc-950 text-blue-600 dark:text-blue-400 shadow-xs border border-zinc-200/40 dark:border-zinc-850" 
                                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200"
                                }`}
                            >
                                <span className={`size-2 rounded-full transition-all duration-250 ${viewMode === "board" ? "bg-blue-500 shadow-sm shadow-blue-500/50" : "bg-zinc-400 dark:bg-zinc-600"}`} />
                                Board
                            </button>
                        </div>
                    </div>
                )}

                <div className="dark:bg-zinc-900/10 rounded-2xl">
                    {activeTab === "tasks" && (
                        <div className="dark:bg-zinc-900/40 rounded">
                            {viewMode === "list" ? <ProjectTasks tasks={tasks} project={project} /> : <ProjectKanban tasks={tasks} project={project} />}
                        </div>
                    )}
                    {activeTab === "backlog" && <BacklogPlanning project={project} tasks={tasks} />}
                    {activeTab === "activesprint" && <ActiveSprint project={project} tasks={tasks} navigate={navigate} />}
                    {activeTab === "epicmapping" && <EpicMapping project={project} tasks={tasks} />}
                    {activeTab === "retro" && <SprintRetro project={project} />}
                    {activeTab === "milestones" && <ProjectMilestones project={project} tasks={tasks} />}
                    {activeTab === "gantt" && <ProjectGantt tasks={tasks} project={project} />}
                    {activeTab === "analytics" && (
                        <div className="space-y-8">
                            <BurndownAnalytics project={project} tasks={tasks} />
                            <div className="pt-6 border-t border-zinc-250 dark:border-zinc-850"><ProjectAnalytics tasks={tasks} project={project} /></div>
                        </div>
                    )}
                    {activeTab === "calendar" && <ProjectCalendar tasks={tasks} projectId={id} />}
                    {activeTab === "history" && <div className="bg-white dark:bg-zinc-900/40 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800"><EntityVersionTimeline entityType="PROJECT" entityId={id} canRollback={true} /></div>}
                    {activeTab === "settings" && <ProjectSettings project={project} />}
                </div>
            </div>

            {showCreateTask && <CreateTaskDialog showCreateTask={showCreateTask} setShowCreateTask={setShowCreateTask} projectId={id} />}
        </div>
    );
}
