import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarIcon, PenIcon } from 'lucide-react';
import { updateTask, addTask } from '@/features/workspaceSlice';
import api from '@/configs/api';
import { useAuth } from '@/context/AuthContext';
import TaskDiscussion from '@/components/task/TaskDiscussion';
import TaskPrerequisites from '@/components/task/TaskPrerequisites';
import TaskRecurrenceSettings from '@/components/task/TaskRecurrenceSettings';

export default function TaskDetails() {
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
            {/* Left: Comments / Discussion */}
            <div className="w-full lg:w-2/3">
                <TaskDiscussion
                    comments={comments}
                    newComment={newComment}
                    setNewComment={setNewComment}
                    handleAddComment={handleAddComment}
                    user={user}
                />
            </div>

            {/* Right: Task + Project Info */}
            <div className="w-full lg:w-1/2 flex flex-col gap-6">
                {/* Task Info */}
                <div className="p-5 rounded-md bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800 text-left">
                    <div className="mb-3">
                        <h1 className="text-lg font-medium text-gray-900 dark:text-zinc-100">{task.title}</h1>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-300 text-xs font-semibold">{task.status}</span>
                            <span className="px-2 py-0.5 rounded bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-300 text-xs font-semibold">{task.type}</span>
                            <span className="px-2 py-0.5 rounded bg-green-200 dark:bg-emerald-900 text-green-900 dark:text-emerald-300 text-xs font-semibold">{task.priority}</span>
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

                {/* Prerequisites */}
                <TaskPrerequisites
                    task={task}
                    availablePrereqs={availablePrereqs}
                    selectedPrereqId={selectedPrereqId}
                    setSelectedPrereqId={setSelectedPrereqId}
                    handleLinkDependency={handleLinkDependency}
                    handleUnlinkDependency={handleUnlinkDependency}
                />

                {/* Recurrence Settings */}
                <TaskRecurrenceSettings
                    task={task}
                    handleUpdateRecurrence={handleUpdateRecurrence}
                    handleTriggerRecurClone={handleTriggerRecurClone}
                />

                {/* Project Info */}
                {project && (
                    <div className="p-4 rounded-md bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border border-gray-300 dark:border-zinc-800 text-left">
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
}
