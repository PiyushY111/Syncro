import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Users, Edit3 } from 'lucide-react';
import api from '@/configs/api';
import { useAuth } from '@/context/AuthContext';
import { updateCapacity } from '@/features/workspaceSlice';
import toast from 'react-hot-toast';

export default function CapacityBalancing({ project, tasks, selectedSprint }) {
    const { token } = useAuth();
    const dispatch = useDispatch();
    const members = project?.members || [];

    const [editingCapacityUserId, setEditingCapacityUserId] = useState(null);
    const [tempCapacity, setTempCapacity] = useState('');

    const handleUpdateCapacity = async (sprintId, userId) => {
        if (!tempCapacity || isNaN(tempCapacity)) return toast.error('Enter a valid number');
        try {
            const { data } = await api.put(`/api/sprints/${sprintId}/capacity`, {
                userId,
                capacity: parseInt(tempCapacity, 10)
            }, { headers: { Authorization: `Bearer ${token}` } });

            dispatch(updateCapacity({
                projectId: project.id,
                sprintId,
                capacity: data.capacity
            }));
            toast.success('Capacity updated successfully');
            setEditingCapacityUserId(null);
            setTempCapacity('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update capacity');
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900/60 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col h-full lg:min-h-[500px]">
            <h3 className="font-bold text-sm flex items-center gap-2 border-b border-zinc-250 dark:border-zinc-800 pb-3 mb-4">
                <Users className="size-4 text-indigo-500" />
                Sprint Capacity Balancing
            </h3>

            {selectedSprint ? (
                <div className="space-y-5">
                    <div className="text-xs space-y-1">
                        <span className="text-zinc-500">Allocated Sprint:</span>
                        <p className="font-bold text-zinc-900 dark:text-white truncate">{selectedSprint.name}</p>
                    </div>

                    <div className="space-y-4">
                        {members.map(member => {
                            const user = member.user;
                            const userSprintTasks = tasks.filter(t => t.sprintId === selectedSprint.id && t.assigneeId === user.id);
                            const allocatedPoints = userSprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
                            
                            const sprintCapacityRecord = selectedSprint.capacities?.find(c => c.userId === user.id);
                            const capacity = sprintCapacityRecord ? sprintCapacityRecord.capacity : 8;
                            
                            const ratio = capacity > 0 ? (allocatedPoints / capacity) * 100 : 0;
                            const isOver = allocatedPoints > capacity;

                            return (
                                <div key={user.id} className="space-y-2 border-b border-zinc-100 dark:border-zinc-850 pb-3 last:border-b-0 last:pb-0">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-semibold truncate max-w-[60%]">{user.name}</span>
                                        
                                        {editingCapacityUserId === user.id ? (
                                            <div className="flex items-center gap-1">
                                                <input type="number" defaultValue={capacity} onChange={(e) => setTempCapacity(e.target.value)} className="w-12 bg-white dark:bg-zinc-950 border border-zinc-350 dark:border-zinc-750 rounded text-center text-xs p-0.5" />
                                                <button onClick={() => handleUpdateCapacity(selectedSprint.id, user.id)} className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded cursor-pointer">Set</button>
                                                <button onClick={() => setEditingCapacityUserId(null)} className="text-[10px] text-zinc-400 hover:text-zinc-200 cursor-pointer">X</button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-zinc-500">
                                                <span>{allocatedPoints} / {capacity} SP</span>
                                                <button onClick={() => { setEditingCapacityUserId(user.id); setTempCapacity(capacity.toString()); }} className="text-zinc-400 hover:text-zinc-200 p-0.5">
                                                    <Edit3 className="size-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="w-full bg-zinc-150 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                                        <div style={{ width: `${Math.min(ratio, 100)}%` }} className={`h-full rounded-full transition-all duration-300 ${isOver ? 'bg-red-500' : ratio > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                    </div>

                                    {isOver && (
                                        <p className="text-[9px] text-red-500 font-bold">Over-allocated by {allocatedPoints - capacity} story points!</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <p className="text-xs text-zinc-400 text-center mt-20">Select a sprint to manage allocations and team loading.</p>
            )}
        </div>
    );
}
