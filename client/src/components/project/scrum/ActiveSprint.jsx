import React from 'react';
import { useDispatch } from 'react-redux';
import { Play, CheckCircle, Calendar, Flag, User, AlertCircle, Kanban } from 'lucide-react';
import api from '@/configs/api';
import { updateTask, updateSprint } from '@/features/workspaceSlice';
import toast from 'react-hot-toast';
import KanbanColumn from '@/components/project/kanban/KanbanColumn';
import { format } from 'date-fns';

export default function ActiveSprint({ project, tasks, navigate }) {
    const dispatch = useDispatch();

    const activeSprint = project?.sprints?.find(s => s.status === 'ACTIVE');
    const stages = project?.stages ? project.stages.split(",") : ["TODO", "IN_PROGRESS", "DONE"];

    const activeTasks = activeSprint ? tasks.filter(t => t.sprintId === activeSprint.id) : [];

    const handleCompleteSprint = async () => {
        const incompleteCount = activeTasks.filter(t => t.status !== "DONE").length;
        const msg = incompleteCount > 0 
            ? `Complete Sprint? ${incompleteCount} incomplete task(s) will be moved back to the Product Backlog.`
            : `Complete Sprint? All tasks are done. Awesome work!`;

        if (!window.confirm(msg)) return;

        try {
            const { data } = await api.put(`/api/sprints/${activeSprint.id}/complete`, {});
            dispatch(updateSprint({ projectId: project.id, sprint: data.sprint }));
            
            // Reload/update the tasks that were unlinked from sprint in the Redux store
            // Let's dispatch updates for all tasks that were incomplete so they have sprintId = null in Redux
            activeTasks.forEach(task => {
                if (task.status !== "DONE") {
                    dispatch(updateTask({ ...task, sprintId: null }));
                }
            });

            toast.success('Sprint completed successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to complete sprint');
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            await api.put(`/api/tasks/${taskId}`, { status: newStatus });
            let updatedTask = structuredClone(activeTasks.find((t) => t.id === taskId));
            updatedTask.status = newStatus;
            dispatch(updateTask(updatedTask));
            toast.success("Task status updated");
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const onDrop = (e, targetStatus) => {
        const taskId = e.dataTransfer.getData("text/task-id");
        if (taskId) {
            const task = activeTasks.find((t) => t.id === taskId);
            if (task && task.status !== targetStatus) {
                handleStatusChange(taskId, targetStatus);
            }
        }
    };

    if (!activeSprint) {
        return (
            <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-16 text-center text-zinc-500 max-w-4xl mx-auto mt-10">
                <Kanban className="size-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-4 animate-pulse" />
                <h3 className="text-lg font-bold text-zinc-750 dark:text-zinc-250">No Active Sprint</h3>
                <p className="text-sm text-zinc-400 mt-2 max-w-md mx-auto">There is no active sprint running for this project. Go to the <strong>Backlog & Planning</strong> tab to initialize and start a sprint.</p>
            </div>
        );
    }

    const totalPoints = activeTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const completedPoints = activeTasks.filter(t => t.status === 'DONE').reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const percent = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

    const columns = stages.map(stageId => ({
        id: stageId,
        title: stageId.replace(/_/g, " "),
        border: stageId === "TODO" ? "border-zinc-200 dark:border-zinc-800" : stageId === "IN_PROGRESS" ? "border-blue-200 dark:border-blue-950" : stageId === "DONE" ? "border-emerald-200 dark:border-emerald-950" : "border-purple-200 dark:border-purple-950"
    }));

    return (
        <div className="space-y-6 text-zinc-900 dark:text-white text-left">
            {/* Active Sprint Header Banner */}
            <div className="bg-white dark:bg-zinc-900/60 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                        <h2 className="text-lg font-bold">{activeSprint.name}</h2>
                    </div>
                    {activeSprint.goal && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-450 italic">Goal: {activeSprint.goal}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-zinc-400">
                        <div className="flex items-center gap-1">
                            <Calendar className="size-3.5" />
                            <span>Ends {format(new Date(activeSprint.endDate), 'MMM dd, yyyy')}</span>
                        </div>
                        <div>
                            <span>Progress: <strong>{completedPoints} / {totalPoints} SP</strong> ({percent}%)</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* Completion bar */}
                    <div className="w-32 bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden hidden sm:block">
                        <div style={{ width: `${percent}%` }} className="h-full bg-emerald-500 rounded-full" />
                    </div>
                    <button onClick={handleCompleteSprint} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold cursor-pointer">
                        <CheckCircle className="size-3.5" /> Complete Sprint
                    </button>
                </div>
            </div>

            {/* Focused Sprint Kanban Board */}
            <div className="flex items-start gap-6 overflow-x-auto pb-6 no-scrollbar min-w-full">
                {columns.map((column, index) => (
                    <KanbanColumn 
                        key={column.id} 
                        column={column} 
                        index={index} 
                        columnTasks={activeTasks.filter((t) => t.status === column.id)} 
                        canManageStages={false} // Disable column actions inside Active Sprint board (kept strictly aligned with project config)
                        onColumnDragStart={() => {}} 
                        onDragOver={(e) => e.preventDefault()} 
                        onDrop={onDrop} 
                        onTaskDragStart={(e, id) => { e.stopPropagation(); e.dataTransfer.setData("text/task-id", id); }} 
                        handleDeleteColumn={() => {}} 
                        navigate={navigate} 
                    />
                ))}
            </div>
        </div>
    );
}
