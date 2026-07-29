import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Calendar, User, Users, ChevronRight, Play, Edit3, Trash2, Plus, Flag, CheckSquare } from 'lucide-react';
import api from '@/configs/api';
import { useAuth } from '@/context/AuthContext';
import { addSprint, updateSprint, deleteSprint, updateTask, updateCapacity } from '@/features/workspaceSlice';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function BacklogPlanning({ project, tasks }) {
    const { token } = testAuthToken();
    const { user: currentUser } = useAuth();
    const dispatch = useDispatch();

    const sprints = project?.sprints || [];
    const members = project?.members || [];

    const [selectedSprintId, setSelectedSprintId] = useState(sprints.find(s => s.status === 'PLANNED')?.id || '');
    const [showCreateSprint, setShowCreateSprint] = useState(false);
    const [sprintName, setSprintName] = useState('');
    const [sprintGoal, setSprintGoal] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [editingCapacityUserId, setEditingCapacityUserId] = useState(null);
    const [tempCapacity, setTempCapacity] = useState('');

    // Fallback token handling
    function testAuthToken() {
        const { token } = useAuth();
        return { token };
    }

    const backlogTasks = tasks.filter(t => !t.sprintId);
    const activeSprint = sprints.find(s => s.status === 'ACTIVE');
    const selectedSprint = sprints.find(s => s.id === selectedSprintId);

    const handleCreateSprint = async (e) => {
        e.preventDefault();
        if (!sprintName.trim() || !startDate || !endDate) {
            return toast.error('Sprint Name, Start Date, and End Date are required');
        }
        try {
            const { data } = await api.post(`/api/sprints/projects/${project.id}`, {
                name: sprintName.trim(),
                goal: sprintGoal.trim(),
                startDate,
                endDate
            }, { headers: { Authorization: `Bearer ${token}` } });

            dispatch(addSprint({ projectId: project.id, sprint: { ...data.sprint, capacities: [], tasks: [] } }));
            toast.success('Sprint created successfully');
            setSprintName('');
            setSprintGoal('');
            setStartDate('');
            setEndDate('');
            setShowCreateSprint(false);
            if (!selectedSprintId) setSelectedSprintId(data.sprint.id);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create Sprint');
        }
    };

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

    const handleTaskSprintAssign = async (taskId, targetSprintId) => {
        try {
            const { data } = await api.put(`/api/tasks/${taskId}`, { sprintId: targetSprintId || null }, { headers: { Authorization: `Bearer ${token}` } });
            dispatch(updateTask(data.task));
            toast.success(targetSprintId ? 'Task added to Sprint' : 'Task returned to Backlog');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to assign task');
        }
    };

    const handleTaskEstimation = async (taskId, points) => {
        try {
            const { data } = await api.put(`/api/tasks/${taskId}`, { storyPoints: points ? parseInt(points, 10) : null }, { headers: { Authorization: `Bearer ${token}` } });
            dispatch(updateTask(data.task));
            toast.success('Estimation updated');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update story points');
        }
    };

    const onDragStart = (e, taskId) => {
        e.dataTransfer.setData('text/task-id', taskId);
    };

    const onDrop = (e, targetSprintId) => {
        const taskId = e.dataTransfer.getData('text/task-id');
        if (taskId) {
            handleTaskSprintAssign(taskId, targetSprintId);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-zinc-900 dark:text-white text-left">
            {/* Left/Middle Column: Backlog & Sprint Slices */}
            <div className="lg:col-span-3 space-y-6">
                
                {/* Active Sprint Summary Banner if active */}
                {activeSprint && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 p-4 rounded-xl flex justify-between items-center">
                        <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded">Active Sprint Running</span>
                            <h3 className="font-bold text-sm mt-1">{activeSprint.name}</h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Ends on {format(new Date(activeSprint.endDate), 'MMM dd, yyyy')}</p>
                        </div>
                        <div className="text-right text-xs">
                            <span className="block font-bold">{tasks.filter(t => t.sprintId === activeSprint.id).length} Tasks</span>
                            <span className="block text-emerald-600 dark:text-emerald-400 font-semibold">{tasks.filter(t => t.sprintId === activeSprint.id).reduce((sum, t) => sum + (t.storyPoints || 0), 0)} story points allocated</span>
                        </div>
                    </div>
                )}

                {/* Backlog Header */}
                <div className="flex justify-between items-center bg-white dark:bg-zinc-900/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div>
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Flag className="size-5 text-indigo-500" />
                            Backlog & Sprint Grooming
                        </h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Drag tasks to sprints, estimate story points, and monitor sprint workload.</p>
                    </div>
                    <button onClick={() => setShowCreateSprint(!showCreateSprint)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold cursor-pointer">
                        <Plus className="size-3.5" /> Create Sprint
                    </button>
                </div>

                {showCreateSprint && (
                    <form onSubmit={handleCreateSprint} className="bg-zinc-50 dark:bg-zinc-900/80 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                        <h3 className="text-sm font-semibold">Create New Planned Sprint</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">Sprint Name</label>
                                <input type="text" value={sprintName} onChange={(e) => setSprintName(e.target.value)} placeholder="e.g. Sprint 1 - Core MVP features" className="w-full text-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-2 focus:ring-1 focus:ring-blue-500" required />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">Sprint Goal</label>
                                <input type="text" value={sprintGoal} onChange={(e) => setSprintGoal(e.target.value)} placeholder="e.g. Set up OAuth, DB pipelines, basic layout" className="w-full text-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-2 focus:ring-1 focus:ring-blue-500" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">Start Date</label>
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full text-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-2 focus:ring-1 focus:ring-blue-500" required />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">End Date</label>
                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full text-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-2 focus:ring-1 focus:ring-blue-500" required />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 text-xs">
                            <button type="button" onClick={() => setShowCreateSprint(false)} className="px-3 py-1.5 border border-zinc-250 dark:border-zinc-800 rounded text-zinc-600 hover:bg-zinc-100 dark:text-zinc-350 dark:hover:bg-zinc-800 cursor-pointer">Cancel</button>
                            <button type="submit" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer font-semibold">Save Sprint</button>
                        </div>
                    </form>
                )}

                {/* Main Split Layout: Backlog vs Sprint Buckets */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Backlog Column */}
                    <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, null)} className="bg-white dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 min-h-[500px] flex flex-col">
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
                                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-850">
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

                    {/* Sprint Buckets Column */}
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col h-[500px]">
                            <div className="flex items-center justify-between pb-3 border-b border-zinc-150 dark:border-zinc-800 mb-4">
                                <h3 className="font-bold text-sm">Sprint Planner</h3>
                                <select value={selectedSprintId} onChange={(e) => setSelectedSprintId(e.target.value)} className="text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 cursor-pointer outline-none">
                                    <option value="" disabled>Select planned sprint...</option>
                                    {sprints.filter(s => s.status === 'PLANNED').map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedSprint ? (
                                <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, selectedSprint.id)} className="flex-1 flex flex-col">
                                    {/* Sprint details */}
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

                                    {/* Sprint tasks */}
                                    <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px] pr-1">
                                        {tasks.filter(t => t.sprintId === selectedSprint.id).length === 0 ? (
                                            <div className="text-center py-12 border border-dashed border-zinc-250 dark:border-zinc-800 rounded bg-zinc-50/50 dark:bg-zinc-950/20 text-zinc-400">
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
                                    <p className="text-[11px] text-zinc-400 mt-1">Select a planned sprint above or create a new one to start allocation.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Right Column: Capacity Allocation / Load Balancing Sidebar */}
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
                                const capacity = sprintCapacityRecord ? sprintCapacityRecord.capacity : 8; // default 8 SP capacity
                                
                                const ratio = capacity > 0 ? (allocatedPoints / capacity) * 100 : 0;
                                const isOver = allocatedPoints > capacity;

                                return (
                                    <div key={user.id} className="space-y-2 border-b border-zinc-100 dark:border-zinc-850 pb-3 last:border-b-0 last:pb-0">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-semibold truncate max-w-[60%]">{user.name}</span>
                                            
                                            {/* Capacity Edit In Place */}
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

                                        {/* Dynamic capacity bar */}
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

        </div>
    );
}
