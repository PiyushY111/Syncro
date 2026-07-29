import React from 'react';
import { useDispatch } from 'react-redux';
import { Calendar, Play, Trash2 } from 'lucide-react';
import api from '@/configs/api';
import { useAuth } from '@/context/AuthContext';
import { updateSprint, deleteSprint } from '@/features/workspaceSlice';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function SprintBucket({ project, tasks, selectedSprint, selectedSprintId, setSelectedSprintId, activeSprint, handleTaskSprintAssign, onDragStart }) {
    const { token } = useAuth();
    const dispatch = useDispatch();
    const sprints = project?.sprints || [];

    const handleStartSprint = async (sprintId) => {
        if (activeSprint) {
            return toast.error(`Sprint "${activeSprint.name}" is already active. Please complete it first.`);
        }
        try {
            const { data } = await api.put(`/api/sprints/${sprintId}/start`, {}, { headers: { Authorization: `Bearer ${token}` } });
            dispatch(updateSprint({ projectId: project.id, sprint: data.sprint }));
            toast.success(`Sprint "${data.sprint.name}" is now active!`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to start Sprint');
        }
    };

    const handleDeleteSprint = async (sprintId) => {
        if (!window.confirm('Delete this Sprint? Associated tasks will return to the backlog.')) return;
        try {
            await api.delete(`/api/sprints/${sprintId}`, { headers: { Authorization: `Bearer ${token}` } });
            dispatch(deleteSprint({ projectId: project.id, sprintId }));
            toast.success('Sprint deleted successfully');
            if (selectedSprintId === sprintId) setSelectedSprintId('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete Sprint');
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col h-[500px]">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-150 dark:border-zinc-800 mb-4">
                <h3 className="font-bold text-sm">Sprint Planner</h3>
                <select value={selectedSprintId} onChange={(e) => setSelectedSprintId(e.target.value)} className="text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 cursor-pointer">
                    <option value="" disabled>Select planned sprint...</option>
                    {sprints.filter(s => s.status === 'PLANNED').map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
            </div>

            {selectedSprint ? (
                <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleTaskSprintAssign(e.dataTransfer.getData('text/task-id'), selectedSprint.id)} className="flex-1 flex flex-col">
                    <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-150 dark:border-zinc-850 text-xs mb-4 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="font-bold">{selectedSprint.name}</span>
                            <div className="flex gap-2">
                                <button onClick={() => handleStartSprint(selectedSprint.id)} className="flex items-center gap-1 px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-semibold hover:bg-emerald-700 cursor-pointer">
                                    <Play className="size-2.5" /> Start
                                </button>
                                <button onClick={() => handleDeleteSprint(selectedSprint.id)} className="text-zinc-400 hover:text-red-500 cursor-pointer">
                                    <Trash2 className="size-3.5" />
                                </button>
                            </div>
                        </div>
                        {selectedSprint.goal && <p className="text-zinc-500 italic text-[11px]">Goal: {selectedSprint.goal}</p>}
                        <div className="flex items-center gap-1.5 text-zinc-400">
                            <Calendar className="size-3" />
                            <span>{format(new Date(selectedSprint.startDate), 'MMM dd')} - {format(new Date(selectedSprint.endDate), 'MMM dd, yyyy')}</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px] pr-1">
                        {tasks.filter(t => t.sprintId === selectedSprint.id).length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-zinc-250 dark:border-zinc-800 rounded bg-zinc-50/50 dark:bg-zinc-950/20 text-zinc-450">
                                <p className="text-xs">Drag backlog tasks here to plan this sprint.</p>
                            </div>
                        ) : (
                            tasks.filter(t => t.sprintId === selectedSprint.id).map(task => (
                                <div key={task.id} draggable onDragStart={(e) => onDragStart(e, task.id)} className="bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded border border-zinc-200 dark:border-zinc-850 cursor-grab hover:border-zinc-300 transition-all text-xs flex justify-between items-center">
                                    <span className="truncate max-w-[70%] font-medium">{task.title}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-bold">{task.storyPoints || 0} SP</span>
                                        <button onClick={() => handleTaskSprintAssign(task.id, null)} className="text-[10px] text-zinc-400 hover:text-red-500 font-semibold cursor-pointer">Remove</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center p-12 my-auto text-zinc-450">
                    <Play className="size-8 mx-auto text-zinc-300 mb-2" />
                    <p className="text-xs">No Planned Sprint Selected.</p>
                </div>
            )}
        </div>
    );
}
