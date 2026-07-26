import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { updateTask, updateProject } from '@/features/workspaceSlice';
import api from '@/configs/api';
import { useAuth } from '@/context/AuthContext';
import KanbanColumn from '@/components/project/kanban/KanbanColumn';
import AddKanbanColumn from '@/components/project/kanban/AddKanbanColumn';

import { getUserWorkspaceRole, canManageProjectStages } from '@/utils/permissions';

export default function ProjectKanban({ tasks, project }) {
    const { token, user: currentUser } = useAuth();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const currentWorkspace = useSelector((state) => state.workspace.currentWorkspace);

    const currentUserRole = getUserWorkspaceRole(currentWorkspace, currentUser?.id);
    const canManageStages = canManageProjectStages(currentUserRole, project, currentUser?.id, currentWorkspace);
    const stages = project?.stages ? project.stages.split(",") : ["TODO", "IN_PROGRESS", "DONE"];

    const columns = stages.map(stageId => ({
        id: stageId,
        title: stageId.replace(/_/g, " "),
        border: stageId === "TODO" ? "border-zinc-200 dark:border-zinc-800" : stageId === "IN_PROGRESS" ? "border-blue-200 dark:border-blue-950" : stageId === "DONE" ? "border-emerald-200 dark:border-emerald-950" : "border-purple-200 dark:border-purple-950"
    }));

    const [newColumnName, setNewColumnName] = useState("");
    const [showAddColumn, setShowAddColumn] = useState(false);

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            await api.put(`/api/tasks/${taskId}`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
            let updatedTask = structuredClone(tasks.find((t) => t.id === taskId));
            updatedTask.status = newStatus;
            dispatch(updateTask(updatedTask));
            toast.success("Task status updated successfully");
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        }
    };

    const handleAddColumn = async (e) => {
        e.preventDefault();
        if (!newColumnName.trim()) return;
        const formattedStage = newColumnName.trim().toUpperCase().replace(/\s+/g, "_");
        if (stages.includes(formattedStage)) return toast.error("Column already exists!");
        try {
            const { data } = await api.put(`/api/projects/${project.id}/stages`, { stages: [...stages, formattedStage] }, { headers: { Authorization: `Bearer ${token}` } });
            dispatch(updateProject(data.project));
            toast.success("Column added successfully");
            setNewColumnName("");
            setShowAddColumn(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add column");
        }
    };

    const handleDeleteColumn = async (stageId) => {
        if (["TODO", "IN_PROGRESS", "DONE"].includes(stageId)) return toast.error("Cannot delete base columns");
        if (!window.confirm("Delete column? Tasks will be moved to 'To Do'.")) return;
        try {
            const { data } = await api.put(`/api/projects/${project.id}/stages`, { stages: stages.filter(s => s !== stageId) }, { headers: { Authorization: `Bearer ${token}` } });
            dispatch(updateProject(data.project));
            toast.success("Column deleted successfully");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete column");
        }
    };

    const onDrop = (e, targetStatus) => {
        const taskId = e.dataTransfer.getData("text/task-id");
        const colIndexStr = e.dataTransfer.getData("text/column-index");
        if (taskId) {
            const task = tasks.find((t) => t.id === taskId);
            if (task && task.status !== targetStatus) handleStatusChange(taskId, targetStatus);
        } else if (colIndexStr !== "") {
            const sourceIndex = parseInt(colIndexStr, 10);
            const targetIndex = stages.indexOf(targetStatus);
            if (sourceIndex !== targetIndex) handleMoveColumn(sourceIndex, targetIndex);
        }
    };

    const handleMoveColumn = async (sourceIndex, targetIndex) => {
        const updatedStages = [...stages];
        const [movedCol] = updatedStages.splice(sourceIndex, 1);
        updatedStages.splice(targetIndex, 0, movedCol);
        try {
            const { data } = await api.put(`/api/projects/${project.id}/stages`, { stages: updatedStages }, { headers: { Authorization: `Bearer ${token}` } });
            dispatch(updateProject(data.project));
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to reorder columns");
        }
    };

    return (
        <div className="flex items-start gap-6 overflow-x-auto pb-6 no-scrollbar min-w-full">
            {columns.map((column, index) => (
                <KanbanColumn key={column.id} column={column} index={index} columnTasks={tasks.filter((t) => t.status === column.id)} canManageStages={canManageStages} onColumnDragStart={(e, i) => e.dataTransfer.setData("text/column-index", i.toString())} onDragOver={(e) => e.preventDefault()} onDrop={onDrop} onTaskDragStart={(e, id) => { e.stopPropagation(); e.dataTransfer.setData("text/task-id", id); }} handleDeleteColumn={handleDeleteColumn} navigate={navigate} />
            ))}
            <AddKanbanColumn canManageStages={canManageStages} showAddColumn={showAddColumn} setShowAddColumn={setShowAddColumn} newColumnName={newColumnName} setNewColumnName={setNewColumnName} handleAddColumn={handleAddColumn} />
        </div>
    );
}
