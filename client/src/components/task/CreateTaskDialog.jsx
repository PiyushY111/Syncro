import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '@/configs/api';
import { addTask } from '@/features/workspaceSlice';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import TaskRecurrenceSelector from './selectors/TaskRecurrenceSelector';
import TaskTypePrioritySelector from './selectors/TaskTypePrioritySelector';
import TaskDatesSelector from './selectors/TaskDatesSelector';

export default function CreateTaskDialog({ showCreateTask, setShowCreateTask, projectId, initialDueDate = "" }) {
    const { token } = useAuth();
    const dispatch = useDispatch();
    const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace || null);
    const project = currentWorkspace?.projects.find((p) => p.id === projectId);
    const teamMembers = project?.members || [];
    const stages = useMemo(() => project?.stages ? project.stages.split(",") : ["TODO", "IN_PROGRESS", "DONE"], [project?.stages]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: "", description: "", type: "TASK", status: "TODO",
        priority: "MEDIUM", assigneeId: "", start_date: "", due_date: initialDueDate || "",
        isRecurring: false, recurrence: "NONE"
    });

    const resetForm = useCallback(() => {
        setFormData({
            title: "", description: "", type: "TASK", status: stages[0] || "TODO",
            priority: "MEDIUM", assigneeId: "", start_date: "", due_date: initialDueDate || "",
            isRecurring: false, recurrence: "NONE"
        });
    }, [stages, initialDueDate]);

    useEffect(() => {
        if (showCreateTask) resetForm();
    }, [showCreateTask, resetForm]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const { data } = await api.post('/api/tasks', { ...formData, workspaceId: currentWorkspace.id, projectId },
                { headers: { Authorization: `Bearer ${token}` } });
            setShowCreateTask(false);
            resetForm();
            dispatch(addTask(data.task));
            toast.success(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return showCreateTask ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/60 backdrop-blur">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg shadow-lg w-full max-w-md p-6 text-zinc-900 dark:text-white text-left">
                <h2 className="text-xl font-bold mb-4">Create New Task</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Title</label>
                        <input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Task title" className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm mt-1" required />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Description</label>
                        <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe task" className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm mt-1 h-20" />
                    </div>
                    <TaskTypePrioritySelector type={formData.type} priority={formData.priority} onChangeType={(type) => setFormData({ ...formData, type })} onChangePriority={(priority) => setFormData({ ...formData, priority })} />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Assignee</label>
                            <select value={formData.assigneeId} onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })} className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm mt-1">
                                <option value="">Unassigned</option>
                                {teamMembers.map((m) => (<option key={m?.user.id} value={m?.user.id}>{m?.user.email}</option>))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Status</label>
                            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm mt-1">
                                {stages.map((st) => (<option key={st} value={st}>{st.replace(/_/g, " ").toLowerCase()}</option>))}
                            </select>
                        </div>
                    </div>
                    <TaskDatesSelector start_date={formData.start_date} due_date={formData.due_date} onChangeStartDate={(sd) => setFormData({ ...formData, start_date: sd })} onChangeDueDate={(dd) => setFormData({ ...formData, due_date: dd })} />
                    <TaskRecurrenceSelector isRecurring={formData.isRecurring} recurrence={formData.recurrence} onChangeRecurring={(r) => setFormData({ ...formData, isRecurring: r })} onChangeRecurrence={(rec) => setFormData({ ...formData, recurrence: rec })} />
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setShowCreateTask(false)} className="rounded border border-zinc-300 dark:border-zinc-700 px-5 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="rounded px-5 py-2 text-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">{isSubmitting ? "Creating..." : "Create Task"}</button>
                    </div>
                </form>
            </div>
        </div>
    ) : null;
}
