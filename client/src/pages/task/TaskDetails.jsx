import toast from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { updateTask, addTask } from '@/features/workspaceSlice';
import api from '@/configs/api';
import { useAuth } from '@/context/AuthContext';
import TaskDiscussion from '@/components/task/details/TaskDiscussion';
import TaskPrerequisites from '@/components/task/details/TaskPrerequisites';
import TaskRecurrenceSettings from '@/components/task/details/TaskRecurrenceSettings';
import TaskInfoCard from './TaskInfoCard';
import TaskProjectInfoCard from './TaskProjectInfoCard';

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

    const fetchComments = useCallback(async () => {
        if (!taskId || !token) return;
        try {
            const { data } = await api.get(`/api/comments/${taskId}`, { headers: { Authorization: `Bearer ${token}` } });
            setComments(data.comments || []);
        } catch (error) { toast.error(error?.response?.data?.message || error.message); }
    }, [taskId, token]);

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        try {
            toast.loading("Adding comment...");
            const { data } = await api.post(`/api/comments`, { taskId: task.id, content: newComment }, { headers: { Authorization: `Bearer ${token}` } });
            setComments((prev) => [...prev, data.comment]);
            setNewComment(""); toast.dismissAll(); toast.success("Comment added.");
        } catch (error) { toast.dismissAll(); toast.error(error?.response?.data?.message || error.message); }
    };

    const handleLinkDependency = async () => {
        if (!selectedPrereqId) return;
        const newDepIds = [...(task.dependencies || []).map(d => d.id), selectedPrereqId];
        try {
            toast.loading("Linking prerequisite...");
            const { data } = await api.put(`/api/tasks/${task.id}`, { dependenciesIds: newDepIds }, { headers: { Authorization: `Bearer ${token}` } });
            dispatch(updateTask(data.task)); setSelectedPrereqId(""); toast.dismissAll(); toast.success("Prerequisite linked successfully");
        } catch (error) { toast.dismissAll(); toast.error(error.response?.data?.message || "Failed to link prerequisite"); }
    };

    const handleUnlinkDependency = async (prereqId) => {
        const newDepIds = (task.dependencies || []).filter(d => d.id !== prereqId).map(d => d.id);
        try {
            toast.loading("Removing prerequisite...");
            const { data } = await api.put(`/api/tasks/${task.id}`, { dependenciesIds: newDepIds }, { headers: { Authorization: `Bearer ${token}` } });
            dispatch(updateTask(data.task)); toast.dismissAll(); toast.success("Prerequisite removed successfully");
        } catch (error) { toast.dismissAll(); toast.error(error.response?.data?.message || "Failed to remove prerequisite"); }
    };

    const handleUpdateRecurrence = async (isRecurring, recurrence) => {
        try {
            const { data } = await api.put(`/api/tasks/${task.id}`, { isRecurring, recurrence }, { headers: { Authorization: `Bearer ${token}` } });
            dispatch(updateTask(data.task)); toast.success("Recurrence settings updated");
        } catch (error) { toast.error(error.response?.data?.message || "Failed to update recurrence"); }
    };

    const handleTriggerRecurClone = async () => {
        try {
            const { data } = await api.post(`/api/tasks/${task.id}/recur-test`, {}, { headers: { Authorization: `Bearer ${token}` } });
            dispatch(addTask(data.clonedTask)); dispatch(updateTask(data.parentTask)); toast.success("Recurrence clone generated successfully!");
        } catch (error) { toast.error(error.response?.data?.message || "Failed to trigger clone"); }
    };

    useEffect(() => {
        if (taskId) {
            fetchComments();
            const interval = setInterval(() => { fetchComments(); }, 10000);
            return () => clearInterval(interval);
        }
    }, [taskId, fetchComments]);

    const availablePrereqs = (project?.tasks || []).filter(t => t.id !== task?.id && !(task?.dependencies || []).some(d => d.id === t.id));

    if (!currentWorkspace) return <div className="text-gray-500 dark:text-zinc-400 px-4 py-6">Loading workspace...</div>;
    if (!task) return <div className="text-red-500 px-4 py-6">Task not found.</div>;

    return (
        <div className="flex flex-col-reverse lg:flex-row gap-6 sm:p-4 text-gray-900 dark:text-zinc-100 max-w-6xl mx-auto">
            <div className="w-full lg:w-2/3">
                <TaskDiscussion comments={comments} newComment={newComment} setNewComment={setNewComment} handleAddComment={handleAddComment} user={user} />
            </div>
            <div className="w-full lg:w-1/2 flex flex-col gap-6">
                <TaskInfoCard task={task} />
                <TaskPrerequisites task={task} availablePrereqs={availablePrereqs} selectedPrereqId={selectedPrereqId} setSelectedPrereqId={setSelectedPrereqId} handleLinkDependency={handleLinkDependency} handleUnlinkDependency={handleUnlinkDependency} />
                <TaskRecurrenceSettings task={task} handleUpdateRecurrence={handleUpdateRecurrence} handleTriggerRecurClone={handleTriggerRecurClone} />
                <TaskProjectInfoCard project={project} />
            </div>
        </div>
    );
}
