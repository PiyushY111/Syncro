import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { updateTask, deleteTask } from '@/features/workspaceSlice';
import api from '@/configs/api';
import { useAuth } from '@/context/AuthContext';

export default function useTaskDetails() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get("projectId");
    const taskId = searchParams.get("taskId");
    const { user } = useAuth();

    const { currentWorkspace } = useSelector((state) => state.workspace);
    const project = currentWorkspace?.projects?.find((p) => p.id === projectId) || null;
    const task = project?.tasks?.find((t) => t.id === taskId) || null;

    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [selectedPrereqId, setSelectedPrereqId] = useState("");

    const fetchComments = useCallback(async () => {
        if (!taskId || !user) return;
        try {
            const { data } = await api.get(`/api/comments/${taskId}`);
            setComments(data.comments || []);
        } catch (error) { toast.error(error?.response?.data?.message || error.message); }
    }, [taskId, user]);

    useEffect(() => {
        if (taskId) {
            fetchComments();
            const interval = setInterval(() => { fetchComments(); }, 10000);
            return () => clearInterval(interval);
        }
    }, [taskId, fetchComments]);

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        const text = newComment.trim();
        const tempComment = {
            id: `temp-${Date.now()}`,
            content: text,
            taskId: task.id,
            createdAt: new Date().toISOString(),
            user: user || { name: "You" }
        };

        // Instant optimistic append (0ms latency)
        setComments((prev) => [...prev, tempComment]);
        setNewComment("");

        try {
            const { data } = await api.post(`/api/comments`, { taskId: task.id, content: text });
            if (data?.comment) {
                setComments((prev) => prev.map(c => c.id === tempComment.id ? data.comment : c));
            }
            toast.success("Comment added.");
        } catch (error) {
            setComments((prev) => prev.filter(c => c.id !== tempComment.id));
            toast.error(error?.response?.data?.message || "Failed to add comment");
        }
    };

    const handleUpdateTask = async (updatedFields) => {
        const previousTask = structuredClone(task);
        // Instant optimistic Redux update (0ms latency)
        dispatch(updateTask({ ...task, ...updatedFields }));

        try {
            const { data } = await api.put(`/api/tasks/${task.id}`, updatedFields);
            if (data?.task) {
                dispatch(updateTask(data.task));
            }
            toast.success(data.message || "Task updated successfully");
        } catch (error) {
            dispatch(updateTask(previousTask));
            toast.error(error.response?.data?.message || "Failed to update task");
        }
    };

    const handleDeleteTask = async () => {
        const confirm = window.confirm("Are you sure you want to delete this task?");
        if (!confirm) return;
        try {
            toast.loading("Deleting task...");
            await api.post('/api/tasks/delete', { tasksIds: [task.id] });
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
            const { data } = await api.put(`/api/tasks/${task.id}`, { dependenciesIds: newDepIds });
            dispatch(updateTask(data.task)); setSelectedPrereqId(""); toast.dismissAll(); toast.success("Prerequisite linked successfully");
        } catch (error) { toast.dismissAll(); toast.error(error.response?.data?.message || "Failed to link prerequisite"); }
    };

    const handleUnlinkDependency = async (prereqId) => {
        const newDepIds = (task.dependencies || []).filter(d => d.id !== prereqId).map(d => d.id);
        try {
            toast.loading("Removing prerequisite...");
            const { data } = await api.put(`/api/tasks/${task.id}`, { dependenciesIds: newDepIds });
            dispatch(updateTask(data.task)); toast.dismissAll(); toast.success("Prerequisite removed successfully");
        } catch (error) { toast.dismissAll(); toast.error(error.response?.data?.message || "Failed to remove prerequisite"); }
    };

    const handleUpdateRecurrence = async (isRecurring, recurrence) => {
        try {
            const { data } = await api.put(`/api/tasks/${task.id}`, { isRecurring, recurrence });
            dispatch(updateTask(data.task)); toast.success("Recurrence settings updated");
        } catch (error) { toast.error(error.response?.data?.message || "Failed to update recurrence"); }
    };

    const availablePrereqs = (project?.tasks || []).filter(t => t.id !== task?.id && !(task?.dependencies || []).some(d => d.id === t.id));

    return {
        user, currentWorkspace, project, task,
        comments, newComment, setNewComment, selectedPrereqId, setSelectedPrereqId, availablePrereqs,
        handleAddComment, handleUpdateTask, handleDeleteTask, handleLinkDependency, handleUnlinkDependency,
        handleUpdateRecurrence
    };
}
