import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { updateTask, addTask, deleteTask } from '@/features/workspaceSlice';
import api from '@/configs/api';
import { useAuth } from '@/context/AuthContext';

export default function useTaskDetails() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
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

    useEffect(() => {
        if (taskId) {
            fetchComments();
            const interval = setInterval(() => { fetchComments(); }, 10000);
            return () => clearInterval(interval);
        }
    }, [taskId, fetchComments]);

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        try {
            toast.loading("Adding comment...");
            const { data } = await api.post(`/api/comments`, { taskId: task.id, content: newComment }, { headers: { Authorization: `Bearer ${token}` } });
            setComments((prev) => [...prev, data.comment]);
            setNewComment(""); toast.dismissAll(); toast.success("Comment added.");
        } catch (error) { toast.dismissAll(); toast.error(error?.response?.data?.message || error.message); }
    };

    const handleUpdateTask = async (updatedFields) => {
        try {
            toast.loading("Updating task...");
            const { data } = await api.put(`/api/tasks/${task.id}`, updatedFields, { headers: { Authorization: `Bearer ${token}` } });
            dispatch(updateTask(data.task));
            toast.dismissAll();
            toast.success(data.message || "Task updated successfully");
        } catch (error) { toast.dismissAll(); toast.error(error.response?.data?.message || "Failed to update task"); }
    };

    const handleDeleteTask = async () => {
        const confirm = window.confirm("Are you sure you want to delete this task?");
        if (!confirm) return;
        try {
            toast.loading("Deleting task...");
            await api.post('/api/tasks/delete', { tasksIds: [task.id] }, { headers: { Authorization: `Bearer ${token}` } });
            dispatch(deleteTask([task.id]));
            toast.dismissAll(); toast.success("Task deleted successfully");
            navigate(`/projectsDetail?id=${projectId}&tab=tasks`);
        } catch (error) { toast.dismissAll(); toast.error(error.response?.data?.message || "Failed to delete task"); }
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

    const availablePrereqs = (project?.tasks || []).filter(t => t.id !== task?.id && !(task?.dependencies || []).some(d => d.id === t.id));

    return {
        user, token, currentWorkspace, project, task,
        comments, newComment, setNewComment, selectedPrereqId, setSelectedPrereqId, availablePrereqs,
        handleAddComment, handleUpdateTask, handleDeleteTask, handleLinkDependency, handleUnlinkDependency,
        handleUpdateRecurrence, handleTriggerRecurClone
    };
}
