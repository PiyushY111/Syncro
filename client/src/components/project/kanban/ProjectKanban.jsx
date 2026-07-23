import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { updateTask, updateProject } from '@/features/workspaceSlice';
import { Plus } from 'lucide-react';
import api from '@/configs/api';
import { useAuth } from '@/context/AuthContext';
import KanbanColumn from '@/components/project/kanban/KanbanColumn';

export default function ProjectKanban({ tasks, project }) {
    const { token } = useAuth();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { user: currentUser } = useAuth();
    const currentWorkspace = useSelector((state) => state.workspace.currentWorkspace);

    const currentUserMember = currentWorkspace?.members?.find(m => m.userId === currentUser?.id);
    const currentUserRole = currentUserMember?.role || (currentWorkspace?.ownerId === currentUser?.id ? 'OWNER' : 'MEMBER');

    const isWorkspaceStaff = ['OWNER', 'ADMIN', 'MANAGER'].includes(currentUserRole);
    const isProjectLead = project?.team_lead === currentUser?.id;
    const canManageStages = isWorkspaceStaff || isProjectLead;

    const stages = project?.stages ? project.stages.split(",") : ["TODO", "IN_PROGRESS", "DONE"];

    const columns = stages.map(stageId => ({
        id: stageId,
        title: stageId.replace(/_/g, " "),
        border: stageId === "TODO" ? "border-zinc-200 dark:border-zinc-800" 
               : stageId === "IN_PROGRESS" ? "border-blue-200 dark:border-blue-950"
               : stageId === "DONE" ? "border-emerald-200 dark:border-emerald-950"
               : "border-purple-200 dark:border-purple-950"
    }));

    const [newColumnName, setNewColumnName] = useState("");
    const [showAddColumn, setShowAddColumn] = useState(false);

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            toast.loading("Updating status...");
            await api.put(`/api/tasks/${taskId}`, { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            let updatedTask = structuredClone(tasks.find((t) => t.id === taskId));
            updatedTask.status = newStatus;
            dispatch(updateTask(updatedTask));

            toast.dismissAll();
            toast.success("Task status updated successfully");
        } catch (error) {
            toast.dismissAll();
            toast.error(error?.response?.data?.message || error.message);
        }
    };

    const handleAddColumn = async (e) => {
        e.preventDefault();
        if (!newColumnName.trim()) return;
        
        const formattedStage = newColumnName.trim().toUpperCase().replace(/\s+/g, "_");
        
        if (stages.includes(formattedStage)) {
            toast.error("Column already exists!");
            return;
        }
        
        const updatedStages = [...stages, formattedStage];
        
        try {
            toast.loading("Adding column...");
            const { data } = await api.put(`/api/projects/${project.id}/stages`, { stages: updatedStages }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            dispatch(updateProject(data.project));
            toast.dismissAll();
            toast.success("Column added successfully");
            setNewColumnName("");
            setShowAddColumn(false);
        } catch (error) {
            toast.dismissAll();
            toast.error(error.response?.data?.message || "Failed to add column");
        }
    };

    const handleDeleteColumn = async (stageId) => {
        if (["TODO", "IN_PROGRESS", "DONE"].includes(stageId)) {
            toast.error("Cannot delete base columns");
            return;
        }
        if (!window.confirm("Are you sure you want to delete this column? Any tasks in this column will be moved to 'To Do'.")) return;
        
        const updatedStages = stages.filter(s => s !== stageId);
        
        try {
            toast.loading("Deleting column...");
            const { data } = await api.put(`/api/projects/${project.id}/stages`, { stages: updatedStages }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            dispatch(updateProject(data.project));
            toast.dismissAll();
            toast.success("Column deleted successfully");
        } catch (error) {
            toast.dismissAll();
            toast.error(error.response?.data?.message || "Failed to delete column");
        }
    };

    const onTaskDragStart = (e, taskId) => {
        e.stopPropagation();
        e.dataTransfer.setData("text/task-id", taskId);
    };

    const onColumnDragStart = (e, colIndex) => {
        e.dataTransfer.setData("text/column-index", colIndex.toString());
    };

    const onDragOver = (e) => {
        e.preventDefault();
    };

    const onDrop = (e, targetStatus) => {
        const taskId = e.dataTransfer.getData("text/task-id");
        const colIndexStr = e.dataTransfer.getData("text/column-index");

        if (taskId) {
            const task = tasks.find((t) => t.id === taskId);
            if (task && task.status !== targetStatus) {
                handleStatusChange(taskId, targetStatus);
            }
        } else if (colIndexStr !== "") {
            const sourceIndex = parseInt(colIndexStr, 10);
            const targetIndex = stages.indexOf(targetStatus);
            if (sourceIndex !== targetIndex) {
                handleMoveColumn(sourceIndex, targetIndex);
            }
        }
    };

    const handleMoveColumn = async (sourceIndex, targetIndex) => {
        const updatedStages = [...stages];
        const [movedCol] = updatedStages.splice(sourceIndex, 1);
        updatedStages.splice(targetIndex, 0, movedCol);

        try {
            toast.loading("Reordering columns...");
            const { data } = await api.put(`/api/projects/${project.id}/stages`, { stages: updatedStages }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            dispatch(updateProject(data.project));
            toast.dismissAll();
            toast.success("Columns reordered successfully");
        } catch (error) {
            toast.dismissAll();
            toast.error(error.response?.data?.message || "Failed to reorder columns");
        }
    };

    return (
        <div className="flex items-start gap-6 overflow-x-auto pb-6 no-scrollbar min-w-full">
            {columns.map((column, index) => {
                const columnTasks = tasks.filter((t) => t.status === column.id);
                return (
                    <KanbanColumn
                        key={column.id}
                        column={column}
                        index={index}
                        columnTasks={columnTasks}
                        canManageStages={canManageStages}
                        onColumnDragStart={onColumnDragStart}
                        onDragOver={onDragOver}
                        onDrop={onDrop}
                        onTaskDragStart={onTaskDragStart}
                        handleDeleteColumn={handleDeleteColumn}
                        navigate={navigate}
                    />
                );
            })}

            {/* Add Column Box */}
            {canManageStages && (
                <div className="w-[300px] flex-shrink-0 bg-slate-50/50 dark:bg-zinc-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800 p-4 transition text-left">
                    {!showAddColumn ? (
                        <button
                            onClick={() => setShowAddColumn(true)}
                            className="w-full h-full flex items-center justify-center gap-2 py-8 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                        >
                            <Plus className="size-4" /> Add Column
                        </button>
                    ) : (
                        <form onSubmit={handleAddColumn} className="space-y-3">
                            <h4 className="text-xs font-semibold text-gray-700 dark:text-zinc-300">Create Column</h4>
                            <input
                                type="text"
                                required
                                value={newColumnName}
                                onChange={(e) => setNewColumnName(e.target.value)}
                                placeholder="Column Name (e.g. QA)"
                                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-zinc-800 dark:bg-zinc-950 text-gray-900 dark:text-white focus:border-blue-500 outline-none"
                            />
                            <div className="flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowAddColumn(false)}
                                    className="px-3 py-1.5 text-[10px] font-medium rounded-lg border border-gray-200 dark:border-zinc-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-3 py-1.5 text-[10px] font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 cursor-pointer"
                                >
                                    Add
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}
