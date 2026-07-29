import React from 'react';
import { useDispatch } from 'react-redux';
import { User } from 'lucide-react';
import api from '@/configs/api';
import { useAuth } from '@/context/AuthContext';
import { updateTask } from '@/features/workspaceSlice';
import toast from 'react-hot-toast';

export default function BacklogList({ backlogTasks, handleTaskSprintAssign, onDragStart }) {
    const { token } = useAuth();
    const dispatch = useDispatch();

    const handleTaskEstimation = async (taskId, points) => {
        try {
            const { data } = await api.put(`/api/tasks/${taskId}`, { storyPoints: points ? parseInt(points, 10) : null }, { headers: { Authorization: `Bearer ${token}` } });
            dispatch(updateTask(data.task));
            toast.success('Estimation updated');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update story points');
        }
    };

    return (
        <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleTaskSprintAssign(e.dataTransfer.getData('text/task-id'), null)} className="bg-white dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 min-h-[500px] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-150 dark:border-zinc-800 mb-4">
                <h3 className="font-bold text-sm">Product Backlog ({backlogTasks.length})</h3>
                <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-650 px-2 py-0.5 rounded font-bold">{backlogTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0)} Total SP</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 max-h-[460px] pr-1">
                {backlogTasks.length === 0 ? (
                    <p className="text-xs text-zinc-400 text-center mt-20">Backlog is empty. Create tasks or drag them back here.</p>
                ) : (
                    backlogTasks.map(task => (
                        <div key={task.id} draggable onDragStart={(e) => onDragStart(e, task.id)} className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-850 cursor-grab hover:shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-left">
                            <p className="text-xs font-semibold">{task.title}</p>
                            {task.description && <p className="text-[10px] text-zinc-450 dark:text-zinc-500 line-clamp-1 mt-1">{task.description}</p>}
                            <div className="flex justify-between items-center mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-855">
                                <div className="flex items-center gap-1.5">
                                    {task.assignee ? (
                                        <span className="text-[9px] text-zinc-500 font-medium flex items-center gap-1">
                                            <User className="size-2.5 text-zinc-400" />
                                            {task.assignee.name.split(' ')[0]}
                                        </span>
                                    ) : (
                                        <span className="text-[9px] text-zinc-400 italic">Unassigned</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-zinc-400">Points:</span>
                                    <select value={task.storyPoints || ''} onChange={(e) => handleTaskEstimation(task.id, e.target.value)} className="text-[10px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-1.5 py-0.5 outline-none cursor-pointer font-bold">
                                        <option value="">-</option>
                                        {[1, 2, 3, 5, 8, 13, 21].map(v => (
                                            <option key={v} value={v}>{v}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
