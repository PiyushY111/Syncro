import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Plus, Flag } from 'lucide-react';
import api from '@/configs/api';
import { useAuth } from '@/context/AuthContext';
import { addSprint, updateTask } from '@/features/workspaceSlice';
import toast from 'react-hot-toast';

import BacklogList from './BacklogList';
import SprintBucket from './SprintBucket';
import CapacityBalancing from './CapacityBalancing';

export default function BacklogPlanning({ project, tasks }) {
    const { token } = useAuth();
    const dispatch = useDispatch();

    const sprints = project?.sprints || [];
    const [selectedSprintId, setSelectedSprintId] = useState(sprints.find(s => s.status === 'PLANNED')?.id || '');
    const [showCreateSprint, setShowCreateSprint] = useState(false);
    const [sprintName, setSprintName] = useState('');
    const [sprintGoal, setSprintGoal] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

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

    const handleTaskSprintAssign = async (taskId, targetSprintId) => {
        try {
            const { data } = await api.put(`/api/tasks/${taskId}`, { sprintId: targetSprintId || null }, { headers: { Authorization: `Bearer ${token}` } });
            dispatch(updateTask(data.task));
            toast.success(targetSprintId ? 'Task added to Sprint' : 'Task returned to Backlog');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to assign task');
        }
    };

    const onDragStart = (e, taskId) => {
        e.dataTransfer.setData('text/task-id', taskId);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-zinc-900 dark:text-white text-left">
            <div className="lg:col-span-3 space-y-6">
                <div className="flex justify-between items-center bg-white dark:bg-zinc-900/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div>
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Flag className="size-5 text-indigo-500" />
                            Backlog & Sprint Grooming
                        </h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-450 mt-1">Drag tasks to sprints, estimate story points, and monitor sprint workload.</p>
                    </div>
                    <button onClick={() => setShowCreateSprint(!showCreateSprint)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold cursor-pointer">
                        <Plus className="size-3.5" /> Create Sprint
                    </button>
                </div>

                {showCreateSprint && (
                    <form onSubmit={handleCreateSprint} className="bg-zinc-50 dark:bg-zinc-900/80 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                        <h3 className="text-sm font-semibold">Create New Planned Sprint</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" value={sprintName} onChange={(e) => setSprintName(e.target.value)} placeholder="Sprint Name" className="w-full text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-2" required />
                            <input type="text" value={sprintGoal} onChange={(e) => setSprintGoal(e.target.value)} placeholder="Sprint Goal" className="w-full text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-2" />
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-2" required />
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-2" required />
                        </div>
                        <div className="flex justify-end gap-2 text-xs">
                            <button type="button" onClick={() => setShowCreateSprint(false)} className="px-3 py-1.5 border border-zinc-250 dark:border-zinc-800 rounded">Cancel</button>
                            <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded font-semibold">Save Sprint</button>
                        </div>
                    </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <BacklogList backlogTasks={backlogTasks} handleTaskSprintAssign={handleTaskSprintAssign} onDragStart={onDragStart} />
                    <SprintBucket project={project} tasks={tasks} selectedSprint={selectedSprint} selectedSprintId={selectedSprintId} setSelectedSprintId={setSelectedSprintId} activeSprint={activeSprint} handleTaskSprintAssign={handleTaskSprintAssign} onDragStart={onDragStart} />
                </div>
            </div>

            <CapacityBalancing project={project} tasks={tasks} selectedSprint={selectedSprint} />
        </div>
    );
}
