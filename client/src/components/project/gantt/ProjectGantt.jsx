import { useState, useRef, useEffect } from 'react';
import { differenceInDays, format } from 'date-fns';
import api from '@/configs/api';
import { useAuth } from '@/context/AuthContext';
import { useDispatch } from 'react-redux';
import { updateTask } from '@/features/workspaceSlice';
import toast from 'react-hot-toast';

import GanttHeader from './GanttHeader';
import GanttTaskList from './GanttTaskList';
import GanttTimelineCanvas from './GanttTimelineCanvas';
import GanttEditModal from './GanttEditModal';
import { useGanttData } from './utils/useGanttData';

export default function ProjectGantt({ tasks = [] }) {
    const { token } = useAuth();
    const dispatch = useDispatch();

    const [zoom, setZoom] = useState('day');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showDependencies, setShowDependencies] = useState(true);
    const [highlightCriticalPath, setHighlightCriticalPath] = useState(false);
    const [milestonesOnly, setMilestonesOnly] = useState(false);

    const [selectedTask, setSelectedTask] = useState(null);
    const [editingDates, setEditingDates] = useState({ start_date: '', due_date: '' });
    const [isUpdating, setIsUpdating] = useState(false);

    const chartBodyRef = useRef(null);
    const taskListRef = useRef(null);

    const {
        startDateBound, timelineDays, columnWidth, filteredTasks,
        criticalPathTaskIds, calcGeometry, dependencyLines
    } = useGanttData(tasks, zoom, searchQuery, statusFilter, milestonesOnly, highlightCriticalPath, showDependencies);

    const handleScroll = (e) => {
        if (taskListRef.current && e.target === chartBodyRef.current) {
            taskListRef.current.scrollTop = e.target.scrollTop;
        }
    };

    const handleOpenEdit = (task) => {
        setSelectedTask(task);
        const s = task.start_date ? new Date(task.start_date) : new Date(task.createdAt);
        setEditingDates({ start_date: format(s, 'yyyy-MM-dd'), due_date: format(new Date(task.due_date), 'yyyy-MM-dd') });
    };

    const handleSaveDates = async () => {
        if (!selectedTask) return;
        setIsUpdating(true);
        try {
            const { data } = await api.put(`/api/tasks/${selectedTask.id}`, editingDates, {
                headers: { Authorization: `Bearer ${token}` }
            });
            dispatch(updateTask(data.task));
            toast.success("Task timeline updated!");
            setSelectedTask(null);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update dates");
        } finally {
            setIsUpdating(false);
        }
    };

    useEffect(() => {
        if (chartBodyRef.current) {
            const todayOffset = differenceInDays(new Date(), startDateBound);
            if (todayOffset > 0) chartBodyRef.current.scrollLeft = Math.max(0, todayOffset * columnWidth - 200);
        }
    }, [startDateBound, columnWidth]);

    return (
        <div className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl text-zinc-100 font-sans">
            <GanttHeader
                zoom={zoom} setZoom={setZoom} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                statusFilter={statusFilter} setStatusFilter={setStatusFilter} showDependencies={showDependencies}
                setShowDependencies={setShowDependencies} highlightCriticalPath={highlightCriticalPath}
                setHighlightCriticalPath={setHighlightCriticalPath} milestonesOnly={milestonesOnly} setMilestonesOnly={setMilestonesOnly}
            />
            <div className="flex flex-1 min-h-[500px] overflow-hidden relative">
                <GanttTaskList taskListRef={taskListRef} filteredTasks={filteredTasks} criticalPathTaskIds={criticalPathTaskIds} handleOpenEdit={handleOpenEdit} />
                <GanttTimelineCanvas chartBodyRef={chartBodyRef} handleScroll={handleScroll} timelineDays={timelineDays} columnWidth={columnWidth} dependencyLines={dependencyLines} filteredTasks={filteredTasks} criticalPathTaskIds={criticalPathTaskIds} getTaskBarGeometry={calcGeometry} handleOpenEdit={handleOpenEdit} />
            </div>
            <GanttEditModal selectedTask={selectedTask} setSelectedTask={setSelectedTask} editingDates={editingDates} setEditingDates={setEditingDates} handleSaveDates={handleSaveDates} isUpdating={isUpdating} />
        </div>
    );
}
