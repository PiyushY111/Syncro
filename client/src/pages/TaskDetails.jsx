import { format } from "date-fns";
import toast from "react-hot-toast";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarIcon, MessageCircle, PenIcon, Lock, Plus, Trash2 } from "lucide-react";
import { updateTask, addTask } from "../features/workspaceSlice";
import api from "../configs/api";
import { useAuth } from "../context/AuthContext";
const TaskDetails = () => {
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get("projectId");
    const taskId = searchParams.get("taskId");

    const { user, token } = useAuth();
    
    const { currentWorkspace } = useSelector((state) => state.workspace);
    const project = currentWorkspace?.projects?.find((p) => p.id === projectId) || null;
    const task = project?.tasks?.find((t) => t.id === taskId) || null;

    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [selectedPrereqId, setSelectedPrereqId] = useState("");

    const fetchComments = async () => {
        if (!taskId) return;
        try {
            const { data } = await api.get(`/api/comments/${taskId}`, { headers: { Authorization: `Bearer ${token}` } });
            setComments(data.comments || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        try {
            toast.loading("Adding comment...");
            const { data } = await api.post(`/api/comments`, { taskId: task.id, content: newComment }, { headers: { Authorization: `Bearer ${token}` } });
            setComments((prev) => [...prev, data.comment]);
            setNewComment("");
            toast.dismissAll();
            toast.success("Comment added.");
        } catch (error) {
            toast.dismissAll();
            toast.error(error?.response?.data?.message || error.message);
            console.error(error);
        }
    };

    const handleLinkDependency = async () => {
        if (!selectedPrereqId) return;
        const currentDeps = task.dependencies || [];
        const newDepIds = [...currentDeps.map(d => d.id), selectedPrereqId];

        try {
            toast.loading("Linking prerequisite...");
            const { data } = await api.put(`/api/tasks/${task.id}`, { dependenciesIds: newDepIds }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            dispatch(updateTask(data.task));
            setSelectedPrereqId("");
            toast.dismissAll();
            toast.success("Prerequisite linked successfully");
        } catch (error) {
            toast.dismissAll();
            toast.error(error.response?.data?.message || "Failed to link prerequisite");
        }
    };

    const handleUnlinkDependency = async (prereqId) => {
        const currentDeps = task.dependencies || [];
        const newDepIds = currentDeps.filter(d => d.id !== prereqId).map(d => d.id);

        try {
            toast.loading("Removing prerequisite...");
            const { data } = await api.put(`/api/tasks/${task.id}`, { dependenciesIds: newDepIds }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            dispatch(updateTask(data.task));
            toast.dismissAll();
            toast.success("Prerequisite removed successfully");
        } catch (error) {
            toast.dismissAll();
            toast.error(error.response?.data?.message || "Failed to remove prerequisite");
        }
    };

    const handleUpdateRecurrence = async (isRecurring, recurrence) => {
        try {
            toast.loading("Updating recurrence settings...");
            const { data } = await api.put(`/api/tasks/${task.id}`, { isRecurring, recurrence }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            dispatch(updateTask(data.task));
            toast.dismissAll();
            toast.success("Recurrence settings updated");
        } catch (error) {
            toast.dismissAll();
            toast.error(error.response?.data?.message || "Failed to update recurrence");
        }
    };

    const handleTriggerRecurClone = async () => {
        try {
            toast.loading("Triggering test clone...");
            const { data } = await api.post(`/api/tasks/${task.id}/recur-test`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            dispatch(addTask(data.clonedTask));
            dispatch(updateTask(data.parentTask));
            toast.dismissAll();
            toast.success("Recurrence clone generated successfully!");
        } catch (error) {
            toast.dismissAll();
            toast.error(error.response?.data?.message || "Failed to trigger clone");
        }
    };

    useEffect(() => {
        if (taskId) {
            fetchComments();
            const interval = setInterval(() => { fetchComments(); }, 10000);
            return () => clearInterval(interval);
        }
    }, [taskId]);

    const availablePrereqs = (project?.tasks || []).filter(
        t => t.id !== task?.id && !(task?.dependencies || []).some(d => d.id === t.id)
    );

    if (!currentWorkspace) return <div className="text-gray-500 dark:text-zinc-400 px-4 py-6">Loading workspace...</div>;
    if (!task) return <div className="text-red-500 px-4 py-6">Task not found.</div>;

    return (
        <div className="flex flex-col-reverse lg:flex-row gap-6 sm:p-4 text-gray-900 dark:text-zinc-100 max-w-6xl mx-auto">
            {/* Left: Comments / Chatbox */}
            <div className="w-full lg:w-2/3">
                <div className="p-5 rounded-md  border border-gray-300 dark:border-zinc-800  flex flex-col lg:h-[80vh]">
                    <h2 className="text-base font-semibold flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
                        <MessageCircle className="size-5" /> Task Discussion ({comments.length})
                    </h2>

                    <div className="flex-1 md:overflow-y-scroll no-scrollbar">
                        {comments.length > 0 ? (
                            <div className="flex flex-col gap-4 mb-6 mr-2">
                                {comments.map((comment) => {
                                    const commentUser = comment?.user || {};
                                    const isOwnComment = commentUser?.id === user?.id;

                                    return (
                                        <div key={comment.id} className={`sm:max-w-4/5 dark:bg-gradient-to-br dark:from-zinc-800 dark:to-zinc-900 border border-gray-300 dark:border-zinc-700 p-3 rounded-md ${isOwnComment ? "ml-auto" : "mr-auto"}`} >
                                            <div className="flex items-center gap-2 mb-1 text-sm text-gray-500 dark:text-zinc-400">
                                                <img src={commentUser.image || ""} alt="avatar" className="size-5 rounded-full" />
                                                <span className="font-medium text-gray-900 dark:text-white">{commentUser.name || "Unknown user"}</span>
                                                <span className="text-xs text-gray-400 dark:text-zinc-600">
                                                    • {format(new Date(comment.createdAt), "dd MMM yyyy, HH:mm")}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-900 dark:text-zinc-200">{comment.content}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-gray-600 dark:text-zinc-500 mb-4 text-sm">No comments yet. Be the first!</p>
                        )}
                    </div>

                    {/* Add Comment */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            className="w-full dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md p-2 text-sm text-gray-900 dark:text-zinc-200 resize-none focus:outline-none focus:ring-1 focus:ring-blue-600"
                            rows={3}
                        />
                        <button onClick={handleAddComment} className="bg-gradient-to-l from-blue-500 to-blue-600 transition-colors text-white text-sm px-5 py-2 rounded " >
                            Post
                        </button>
                    </div>
                </div>
            </div>

            {/* Right: Task + Project Info */}
            <div className="w-full lg:w-1/2 flex flex-col gap-6">
                {/* Task Info */}
                <div className="p-5 rounded-md bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800 ">
                    <div className="mb-3">
                        <h1 className="text-lg font-medium text-gray-900 dark:text-zinc-100">{task.title}</h1>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-300 text-xs">
                                {task.status}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-300 text-xs">
                                {task.type}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-green-200 dark:bg-emerald-900 text-green-900 dark:text-emerald-300 text-xs">
                                {task.priority}
                            </span>
                        </div>
                    </div>

                    {task.description && (
                        <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed mb-4">{task.description}</p>
                    )}

                    <hr className="border-zinc-200 dark:border-zinc-700 my-3" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-zinc-300">
                        <div className="flex items-center gap-2">
                            <img src={task.assignee?.image} className="size-5 rounded-full" alt="avatar" />
                            {task.assignee?.name || "Unassigned"}
                        </div>
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="size-4 text-gray-500 dark:text-zinc-500" />
                            Due : {format(new Date(task.due_date), "dd MMM yyyy")}
                        </div>
                    </div>
                </div>

                {/* Prerequisites (Dependencies) */}
                <div className="p-5 rounded-md bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800 flex flex-col gap-4">
                    <h3 className="text-base font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                        <Lock className="size-4 text-amber-500" /> Prerequisites (Dependencies)
                    </h3>
                    
                    {/* List of current prerequisites */}
                    <div className="space-y-2">
                        {task.dependencies && task.dependencies.length > 0 ? (
                            task.dependencies.map(dep => (
                                <div key={dep.id} className="flex items-center justify-between p-2.5 rounded border border-gray-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{dep.title}</span>
                                        <span className="text-[10px] text-gray-500 dark:text-zinc-500 capitalize">{dep.type.toLowerCase()} • {dep.status.replace("_", " ")}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${dep.status === "DONE" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400"}`}>
                                            {dep.status === "DONE" ? "Completed" : "Incomplete"}
                                        </span>
                                        <button onClick={() => handleUnlinkDependency(dep.id)} className="text-zinc-400 hover:text-red-500 p-1 rounded transition-colors" title="Remove Prerequisite">
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-gray-500 dark:text-zinc-500 italic py-2">No prerequisites defined.</p>
                        )}
                    </div>

                    {/* Link new prerequisite selector */}
                    {availablePrereqs.length > 0 && (
                        <div className="flex gap-2 items-center mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                            <select value={selectedPrereqId} onChange={(e) => setSelectedPrereqId(e.target.value)} className="flex-1 text-xs bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white rounded border border-gray-300 dark:border-zinc-800 p-2 outline-none" >
                                <option value="">Select Prerequisite...</option>
                                {availablePrereqs.map(t => (
                                    <option key={t.id} value={t.id}>{t.title} ({t.status})</option>
                                ))}
                            </select>
                            <button onClick={handleLinkDependency} disabled={!selectedPrereqId} className="flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs px-3 py-2 rounded font-medium disabled:opacity-50 hover:opacity-90 transition cursor-pointer" >
                                <Plus className="size-3.5 mr-1" /> Link
                            </button>
                        </div>
                    )}
                </div>

                {/* Recurrence Settings */}
                <div className="p-5 rounded-md bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800 flex flex-col gap-4">
                    <h3 className="text-base font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                        <CalendarIcon className="size-4 text-blue-500" /> Recurring Task Settings
                    </h3>
                    
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 dark:text-zinc-400">Recurrence Status</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${task.isRecurring ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400" : "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400"}`}>
                                {task.isRecurring ? `Recurring (${task.recurrence})` : "Non-recurring"}
                            </span>
                        </div>

                        {task.lastRecurredAt && (
                            <div className="text-xs text-gray-500 dark:text-zinc-500">
                                Last cloned: {format(new Date(task.lastRecurredAt), "dd MMM yyyy, HH:mm")}
                            </div>
                        )}

                        <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                            <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400">Configure Recurrence</label>
                            <div className="flex gap-2">
                                <select 
                                    value={task.isRecurring ? task.recurrence : "NONE"} 
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "NONE") {
                                            handleUpdateRecurrence(false, "NONE");
                                        } else {
                                            handleUpdateRecurrence(true, val);
                                        }
                                    }}
                                    className="flex-1 text-xs bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white rounded border border-gray-300 dark:border-zinc-800 p-2 outline-none cursor-pointer"
                                >
                                    <option value="NONE">No Recurrence</option>
                                    <option value="DAILY">Daily</option>
                                    <option value="WEEKLY">Weekly</option>
                                    <option value="MONTHLY">Monthly</option>
                                </select>
                            </div>
                        </div>

                        {task.isRecurring && (
                            <button 
                                onClick={handleTriggerRecurClone} 
                                className="w-full mt-2 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white text-xs py-2 rounded font-medium hover:opacity-90 transition cursor-pointer"
                            >
                                Trigger Recurrence Clone (Dev Test)
                            </button>
                        )}
                    </div>
                </div>

                {/* Project Info */}
                {project && (
                    <div className="p-4 rounded-md bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border border-gray-300 dark:border-zinc-800 ">
                        <p className="text-xl font-medium mb-4">Project Details</p>
                        <h2 className="text-gray-900 dark:text-zinc-100 flex items-center gap-2"> <PenIcon className="size-4" /> {project.name}</h2>
                        <p className="text-xs mt-3">Project Start Date: {format(new Date(project.start_date), "dd MMM yyyy")}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-zinc-400 mt-3">
                            <span>Status: {project.status}</span>
                            <span>Priority: {project.priority}</span>
                            <span>Progress: {project.progress}%</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskDetails;
