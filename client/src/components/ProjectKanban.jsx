import { format } from "date-fns";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { updateTask, updateProject } from "../features/workspaceSlice";
import { Bug, CalendarIcon, GitCommit, MessageSquare, Square, Zap, Trash2, Plus, Lock } from "lucide-react";
import api from "../configs/api";
import { useAuth } from "../context/AuthContext";

const typeIcons = {
    BUG: { icon: Bug, color: "text-red-600 dark:text-red-400" },
    FEATURE: { icon: Zap, color: "text-blue-600 dark:text-blue-400" },
    TASK: { icon: Square, color: "text-green-600 dark:text-green-400" },
    IMPROVEMENT: { icon: GitCommit, color: "text-purple-600 dark:text-purple-400" },
    OTHER: { icon: MessageSquare, color: "text-amber-600 dark:text-amber-400" },
};

const priorityTexts = {
    LOW: { background: "bg-red-100 dark:bg-red-950", prioritycolor: "text-red-600 dark:text-red-400" },
    MEDIUM: { background: "bg-blue-100 dark:bg-blue-950", prioritycolor: "text-blue-600 dark:text-blue-400" },
    HIGH: { background: "bg-emerald-100 dark:bg-emerald-950", prioritycolor: "text-emerald-600 dark:text-emerald-400" },
};

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
                const isBaseStage = ["TODO", "IN_PROGRESS", "DONE"].includes(column.id);

                return (
                    <div
                        key={column.id}
                        draggable={canManageStages}
                        onDragStart={(e) => onColumnDragStart(e, index)}
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, column.id)}
                        className={`w-[300px] flex-shrink-0 flex flex-col rounded-2xl border ${column.border} bg-slate-50/50 dark:bg-zinc-900/30 p-4 min-h-[500px] transition-colors cursor-grab active:cursor-grabbing`}
                    >
                        {/* Column Header */}
                        <div className="flex items-center justify-between mb-4 px-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-sm text-gray-800 dark:text-zinc-200 capitalize">
                                    {column.title.toLowerCase()}
                                </h3>
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400">
                                    {columnTasks.length}
                                </span>
                            </div>
                            {!isBaseStage && canManageStages && (
                                <button
                                    onClick={() => handleDeleteColumn(column.id)}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                    title="Delete Column"
                                >
                                    <Trash2 className="size-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Column Tasks */}
                        <div className="flex flex-col gap-3 flex-1">
                            {columnTasks.length > 0 ? (
                                columnTasks.map((task) => {
                                    const { icon: Icon, color } = typeIcons[task.type] || {};
                                    const { background, prioritycolor } = priorityTexts[task.priority] || {};

                                    return (
                                        <div
                                            key={task.id}
                                            draggable
                                            onDragStart={(e) => onTaskDragStart(e, task.id)}
                                            onClick={() => navigate(`/taskDetails?projectId=${task.projectId}&taskId=${task.id}`)}
                                            className="group bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm hover:shadow-md dark:hover:border-zinc-700 transition cursor-grab active:cursor-grabbing flex flex-col gap-3"
                                        >
                                            <h4 className="font-medium text-sm text-gray-800 dark:text-zinc-100 line-clamp-2 flex items-center gap-1.5">
                                                {task.dependencies?.some(d => d.status !== "DONE") && (
                                                    <Lock className="size-3.5 text-amber-500 flex-shrink-0" title="Blocked by prerequisites" />
                                                )}
                                                <span>{task.title}</span>
                                            </h4>

                                            <div className="flex flex-wrap items-center gap-2">
                                                <div className="flex items-center gap-1.5 text-xs">
                                                    {Icon && <Icon className={`size-3.5 ${color}`} />}
                                                    <span className={`uppercase font-medium text-[11px] ${color}`}>{task.type}</span>
                                                </div>
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${background} ${prioritycolor}`}>
                                                    {task.priority}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between border-t border-gray-100 dark:border-zinc-800/80 pt-3 mt-1">
                                                <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-zinc-400">
                                                    <CalendarIcon className="size-3.5" />
                                                    <span>{format(new Date(task.due_date), "dd MMM")}</span>
                                                </div>
                                                {task.assignee && (
                                                    <div className="flex items-center gap-1.5">
                                                        {task.assignee.image ? (
                                                            <img
                                                                src={task.assignee.image}
                                                                alt={task.assignee.name}
                                                                title={task.assignee.name}
                                                                className="size-5 rounded-full border border-white dark:border-zinc-800 object-cover"
                                                            />
                                                        ) : (
                                                            <div
                                                                title={task.assignee.name}
                                                                className="size-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-[9px] font-bold border border-white dark:border-zinc-800"
                                                            >
                                                                {task.assignee.name?.charAt(0).toUpperCase() || "?"}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-zinc-800/50 rounded-xl py-8 px-4 text-center">
                                    <p className="text-xs text-gray-400 dark:text-zinc-500">
                                        Drag tasks here
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Add Column Box */}
            {canManageStages && (
                <div className="w-[300px] flex-shrink-0 bg-slate-50/50 dark:bg-zinc-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800 p-4 transition">
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
