import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { differenceInDays, format, addMonths, subMonths } from 'date-fns';
import api from '@/configs/api';
import { useAuth } from '@/context/AuthContext';
import { useDispatch, useSelector } from 'react-redux';
import { updateTask } from '@/features/workspaceSlice';
import toast from 'react-hot-toast';
import GanttHeader from './GanttHeader';
import GanttTaskList from './GanttTaskList';
import GanttTimelineCanvas from './GanttTimelineCanvas';
import GanttEditModal from './GanttEditModal';
import GanttSummaryBar from './components/GanttSummaryBar';
import { useGanttData } from './utils/useGanttData';
import { getUserWorkspaceRole, canEditTask } from '@/utils/permissions';

export default function ProjectGantt({ tasks = [], project }) {
    const { token, user } = useAuth();
    const dispatch = useDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const currentWorkspace = useSelector((state) => state.workspace.currentWorkspace);
    const currentUserRole = getUserWorkspaceRole(currentWorkspace, user?.id);

    const [zoom, setZoom] = useState('day');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showDependencies, setShowDependencies] = useState(true);
    const [highlightCriticalPath, setHighlightCriticalPath] = useState(false);
    const [milestonesOnly, setMilestonesOnly] = useState(false);
    const [groupByStatus, setGroupByStatus] = useState(true);
    const [expandedGroups, setExpandedGroups] = useState({ IN_PROGRESS: true, TODO: true, DONE: true });

    const dateParam = searchParams.get('date');
    const [selectedDate, setSelectedDate] = useState(() => dateParam && !isNaN(new Date(dateParam).getTime()) ? new Date(dateParam) : new Date());
    const [currentMonth, setCurrentMonth] = useState(() => selectedDate);
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [selectedTask, setSelectedTask] = useState(null);
    const [editingDates, setEditingDates] = useState({ start_date: '', due_date: '' });
    const [isUpdating, setIsUpdating] = useState(false);
    const [taskPanelWidth, setTaskPanelWidth] = useState(380);
    const [isResizingTasks, setIsResizingTasks] = useState(false);

    const chartBodyRef = useRef(null);
    const taskListRef = useRef(null);
    const ganttRef = useRef(null);

    const { startDateBound, timelineDays, columnWidth, filteredTasks, criticalPathTaskIds, calcGeometry, dependencyLines } = useGanttData(tasks, zoom, searchQuery, statusFilter, milestonesOnly, highlightCriticalPath, showDependencies, customStartDate, customEndDate, currentMonth);

    const handleScroll = (e) => { if (taskListRef.current && e.target === chartBodyRef.current) taskListRef.current.scrollTop = e.target.scrollTop; };

    const scrollToDate = (targetDate) => {
        if (chartBodyRef.current && startDateBound && targetDate) {
            const offset = differenceInDays(targetDate, startDateBound);
            chartBodyRef.current.scrollLeft = Math.max(0, offset * columnWidth - 200);
        }
    };

    const handleSelectDate = (date) => {
        setSelectedDate(date);
        setCurrentMonth(date);
        scrollToDate(date);
    };

    const handlePrevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
    const handleNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));

    const handleJumpToToday = () => {
        const now = new Date();
        setSelectedDate(now);
        setCurrentMonth(now);
        setCustomStartDate(''); setCustomEndDate('');
        scrollToDate(now);
    };

    const handleViewInCalendar = (task) => {
        const pId = project?.id || task?.projectId || searchParams.get('id');
        const dateStr = task?.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : '';
        setSearchParams({ id: pId, tab: 'calendar', date: dateStr });
    };

    const handleSwitchToCalendar = () => setSearchParams({ id: project?.id || searchParams.get('id'), tab: 'calendar' });

    const handleOpenEdit = (task) => {
        const proj = project || currentWorkspace?.projects?.find(p => p.id === task.projectId);
        if (!canEditTask(currentUserRole, proj, task, user?.id, currentWorkspace)) return toast.error("No permission to edit task schedule");
        setSelectedTask(task);
        const s = task.start_date ? new Date(task.start_date) : new Date(task.createdAt);
        setEditingDates({ start_date: format(s, 'yyyy-MM-dd'), due_date: format(new Date(task.due_date), 'yyyy-MM-dd') });
    };

    const handleSaveDates = async () => {
        if (!selectedTask) return;
        setIsUpdating(true);
        try {
            const { data } = await api.put(`/api/tasks/${selectedTask.id}`, editingDates, { headers: { Authorization: `Bearer ${token}` } });
            dispatch(updateTask(data.task));
            toast.success("Task schedule updated!");
            setSelectedTask(null);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update dates");
        } finally {
            setIsUpdating(false);
        }
    };

    useEffect(() => {
        if (dateParam && !isNaN(new Date(dateParam).getTime())) {
            const parsed = new Date(dateParam);
            setSelectedDate(parsed);
            setCurrentMonth(parsed);
        }
    }, [dateParam]);

    useEffect(() => {
        if (selectedDate) scrollToDate(selectedDate);
    }, [startDateBound, columnWidth]);

    useEffect(() => {
        if (!isResizingTasks) return undefined;

        const resizeTasks = (event) => {
            const ganttLeft = ganttRef.current?.getBoundingClientRect().left || 0;
            setTaskPanelWidth(Math.min(540, Math.max(250, event.clientX - ganttLeft)));
        };
        const stopResizing = () => setIsResizingTasks(false);

        window.addEventListener('mousemove', resizeTasks);
        window.addEventListener('mouseup', stopResizing);
        return () => {
            window.removeEventListener('mousemove', resizeTasks);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizingTasks]);

    return (
        <div ref={ganttRef} className={`gantt-reference flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-800 shadow-[0_20px_55px_rgba(15,23,42,0.08)] font-sans ${isResizingTasks ? 'select-none cursor-col-resize' : ''}`}>
            <GanttHeader project={project} currentMonth={currentMonth} zoom={zoom} setZoom={setZoom} searchQuery={searchQuery} setSearchQuery={setSearchQuery} statusFilter={statusFilter} setStatusFilter={setStatusFilter} showDependencies={showDependencies} setShowDependencies={setShowDependencies} highlightCriticalPath={highlightCriticalPath} setHighlightCriticalPath={setHighlightCriticalPath} milestonesOnly={milestonesOnly} setMilestonesOnly={setMilestonesOnly} groupByStatus={groupByStatus} setGroupByStatus={setGroupByStatus} onJumpToToday={handleJumpToToday} onSwitchToCalendar={handleSwitchToCalendar} customStartDate={customStartDate} setCustomStartDate={setCustomStartDate} customEndDate={customEndDate} setCustomEndDate={setCustomEndDate} handlePrevMonth={handlePrevMonth} handleNextMonth={handleNextMonth} />
            <GanttSummaryBar tasks={filteredTasks} criticalPathCount={criticalPathTaskIds.size} hasConflicts={dependencyLines.some(l => l.isConflict)} />
            <div className="flex flex-1 min-h-[500px] overflow-hidden relative">
                <GanttTaskList taskListRef={taskListRef} taskPanelWidth={taskPanelWidth} onResizeStart={() => setIsResizingTasks(true)} filteredTasks={filteredTasks} criticalPathTaskIds={criticalPathTaskIds} handleOpenEdit={handleOpenEdit} onViewInCalendar={handleViewInCalendar} groupByStatus={groupByStatus} expandedGroups={expandedGroups} setExpandedGroups={setExpandedGroups} />
                <GanttTimelineCanvas chartBodyRef={chartBodyRef} handleScroll={handleScroll} timelineDays={timelineDays} columnWidth={columnWidth} dependencyLines={dependencyLines} filteredTasks={filteredTasks} criticalPathTaskIds={criticalPathTaskIds} getTaskBarGeometry={calcGeometry} handleOpenEdit={handleOpenEdit} onViewInCalendar={handleViewInCalendar} selectedDate={selectedDate} onSelectDate={handleSelectDate} groupByStatus={groupByStatus} expandedGroups={expandedGroups} />
            </div>
            <GanttEditModal selectedTask={selectedTask} setSelectedTask={setSelectedTask} editingDates={editingDates} setEditingDates={setEditingDates} handleSaveDates={handleSaveDates} isUpdating={isUpdating} />
        </div>
    );
}
