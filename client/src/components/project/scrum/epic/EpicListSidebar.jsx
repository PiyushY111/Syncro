import React from 'react';
import { useDispatch } from 'react-redux';
import api from '@/configs/api';
import { updateTask } from '@/features/workspaceSlice';
import toast from 'react-hot-toast';

export default function EpicListSidebar({ project, tasks }) {
    const dispatch = useDispatch();
    const epics = project?.epics || [];
    const unmappedTasks = tasks.filter(t => !t.epicId);

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
        <div className="sx-glass p-5 rounded-2xl h-full lg:min-h-[500px] flex flex-col">
            <h3 className="font-bold text-sm border-b border-slate-900/10 dark:border-white/[0.07] pb-3 mb-4">Unmapped Task Backlog</h3>
            
            <div className="flex-1 overflow-y-auto space-y-3 max-h-[460px] pr-1">
                {unmappedTasks.length === 0 ? (
                    <p className="text-xs text-zinc-400 text-center mt-20">All tasks mapped to epics!</p>
                ) : (
                    unmappedTasks.map(task => (
                        <div key={task.id} className="bg-slate-500/[0.05] dark:bg-white/[0.02] p-3 rounded-lg border border-slate-900/[0.07] dark:border-white/[0.07] space-y-3 text-left">
                            <span className="text-xs font-semibold block">{task.title}</span>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-900/[0.05] dark:border-white/[0.07]">
                                <span className="text-[10px] text-zinc-400">Add to Epic:</span>
                                <select 
                                    value="" 
                                    onChange={(e) => handleAssignEpic(task.id, e.target.value)}
                                    className="text-[10px] bg-white/70 dark:bg-white/[0.04] border border-slate-900/[0.07] dark:border-white/[0.07] rounded px-1.5 py-0.5 outline-none cursor-pointer font-bold"
                                >
                                    <option value="" disabled>Choose...</option>
                                    {epics.map(ep => (
                                        <option key={ep.id} value={ep.id}>{ep.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
