import React from 'react';
import { useDispatch } from 'react-redux';
import { Trash2 } from 'lucide-react';
import api from '@/configs/api';
import { deleteEpic, updateTask } from '@/features/workspaceSlice';
import toast from 'react-hot-toast';

export default function EpicCard({ project, epic, tasks }) {
    const dispatch = useDispatch();

    const epicTasks = tasks.filter(t => t.epicId === epic.id);
    const completedTasks = epicTasks.filter(t => t.status === 'DONE');
    const totalPoints = epicTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const completedPoints = completedTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const percent = epicTasks.length > 0 ? Math.round((completedTasks.length / epicTasks.length) * 100) : 0;

    const handleDeleteEpic = async (epicId) => {
        if (!window.confirm('Are you sure you want to delete this Epic? Tasks will be unlinked.')) return;
        try {
            await api.delete(`/api/epics/${epicId}`);
            dispatch(deleteEpic({ projectId: project.id, epicId }));
            toast.success('Epic deleted successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete Epic');
        }
    };

    const handleAssignEpic = async (taskId, epicId) => {
        try {
            const { data } = await api.put(`/api/tasks/${taskId}`, { epicId: epicId || null });
            dispatch(updateTask(data.task));
            toast.success(epicId ? 'Task linked to Epic' : 'Task unlinked');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update task');
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-xs">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                    <span style={{ backgroundColor: epic.color }} className="w-3 h-3 rounded-full" />
                    <h3 className="font-bold text-sm">{epic.name}</h3>
                </div>
                <button onClick={() => handleDeleteEpic(epic.id)} className="text-zinc-400 hover:text-red-500 cursor-pointer p-1">
                    <Trash2 className="size-4" />
                </button>
            </div>
            {epic.description && (
                <p className="text-xs text-zinc-500 dark:text-zinc-450 mt-1">{epic.description}</p>
            )}

            <div className="grid grid-cols-3 gap-2 mt-4 text-xs bg-zinc-50 dark:bg-zinc-950/60 p-2.5 rounded border border-zinc-150 dark:border-zinc-850">
                <div>
                    <span className="block text-zinc-400 text-[10px]">Tasks</span>
                    <span className="font-bold">{completedTasks.length} / {epicTasks.length}</span>
                </div>
                <div>
                    <span className="block text-zinc-400 text-[10px]">Points</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{completedPoints} / {totalPoints} SP</span>
                </div>
                <div>
                    <span className="block text-zinc-400 text-[10px]">Progress</span>
                    <span className="font-bold">{percent}%</span>
                </div>
            </div>

            <div className="w-full bg-zinc-150 dark:bg-zinc-800 h-1.5 rounded-full mt-4 overflow-hidden">
                <div style={{ width: `${percent}%`, backgroundColor: epic.color }} className="h-full rounded-full transition-all duration-500" />
            </div>

            <div className="mt-4 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold block mb-2">Linked Tasks:</span>
                {epicTasks.length === 0 ? (
                    <p className="text-xs text-zinc-400">No tasks linked.</p>
                ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {epicTasks.map(task => (
                            <div key={task.id} className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950 p-2 rounded text-xs border border-zinc-150 dark:border-zinc-850">
                                <span className="truncate max-w-[80%] font-medium">{task.title}</span>
                                <button onClick={() => handleAssignEpic(task.id, null)} className="text-zinc-400 hover:text-red-500 text-[10px] font-semibold cursor-pointer">Unlink</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
