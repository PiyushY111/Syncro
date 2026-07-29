import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Plus, Trash2, Folder, Layers, CheckSquare, MessageSquare } from 'lucide-react';
import api from '@/configs/api';
import { useAuth } from '@/context/AuthContext';
import { addEpic, updateEpic, deleteEpic, updateTask } from '@/features/workspaceSlice';
import toast from 'react-hot-toast';

export default function EpicMapping({ project, tasks }) {
    const { token } = useAuth();
    const dispatch = useDispatch();
    const epics = project?.epics || [];

    const [showCreate, setShowCreate] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#8B5CF6'); // default purple

    const colors = [
        { hex: '#8B5CF6', label: 'Purple' },
        { hex: '#3B82F6', label: 'Blue' },
        { hex: '#10B981', label: 'Green' },
        { hex: '#F59E0B', label: 'Amber' },
        { hex: '#EF4444', label: 'Red' },
        { hex: '#EC4899', label: 'Pink' },
        { hex: '#6B7280', label: 'Gray' }
    ];

    const handleCreateEpic = async (e) => {
        e.preventDefault();
        if (!name.trim()) return toast.error('Epic name is required');
        try {
            const { data } = await api.post(`/api/epics/projects/${project.id}`, {
                name: name.trim(),
                description: description.trim(),
                color
            }, { headers: { Authorization: `Bearer ${token}` } });

            dispatch(addEpic({ projectId: project.id, epic: data.epic }));
            toast.success('Epic created successfully');
            setName('');
            setDescription('');
            setShowCreate(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create Epic');
        }
    };

    const handleDeleteEpic = async (epicId) => {
        if (!window.confirm('Are you sure you want to delete this Epic? Tasks will be unlinked.')) return;
        try {
            await api.delete(`/api/epics/${epicId}`, { headers: { Authorization: `Bearer ${token}` } });
            dispatch(deleteEpic({ projectId: project.id, epicId }));
            toast.success('Epic deleted successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete Epic');
        }
    };

    const handleAssignEpic = async (taskId, epicId) => {
        try {
            const { data } = await api.put(`/api/tasks/${taskId}`, { epicId: epicId || null }, { headers: { Authorization: `Bearer ${token}` } });
            dispatch(updateTask(data.task));
            toast.success(epicId ? 'Task linked to Epic' : 'Task unlinked from Epic');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update task Epic association');
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-zinc-900 dark:text-white">
            {/* Left Column: Epics List & Management */}
            <div className="md:col-span-2 space-y-6">
                <div className="flex justify-between items-center bg-white dark:bg-zinc-900/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div>
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Layers className="size-5 text-indigo-500" />
                            Epics & Feature Maps
                        </h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Group your tasks into high-level features and track their completion.</p>
                    </div>
                    <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold cursor-pointer">
                        <Plus className="size-3.5" /> New Epic
                    </button>
                </div>

                {showCreate && (
                    <form onSubmit={handleCreateEpic} className="bg-zinc-50 dark:bg-zinc-900/80 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                        <h3 className="text-sm font-semibold">Create New Epic</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">Epic Name</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Authentication & Security" className="w-full text-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-2 focus:ring-1 focus:ring-blue-500" required />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">Color Theme</label>
                                <div className="flex gap-2 mt-1">
                                    {colors.map((c) => (
                                        <button key={c.hex} type="button" onClick={() => setColor(c.hex)} style={{ backgroundColor: c.hex }} className={`size-6 rounded-full border cursor-pointer transition-all ${color === c.hex ? 'border-zinc-900 dark:border-white scale-110' : 'border-transparent hover:scale-105'}`} title={c.label} />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-500 mb-1">Description</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief overview of features grouped under this epic..." rows={2} className="w-full text-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-2 focus:ring-1 focus:ring-blue-500" />
                        </div>
                        <div className="flex justify-end gap-2 text-xs">
                            <button type="button" onClick={() => setShowCreate(false)} className="px-3 py-1.5 border border-zinc-250 dark:border-zinc-800 rounded text-zinc-600 hover:bg-zinc-100 dark:text-zinc-350 dark:hover:bg-zinc-800 cursor-pointer">Cancel</button>
                            <button type="submit" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer font-semibold">Create Epic</button>
                        </div>
                    </form>
                )}

                {/* Epic list items */}
                <div className="space-y-4">
                    {epics.length === 0 ? (
                        <div className="text-center p-12 bg-white dark:bg-zinc-900/20 border border-dashed border-zinc-250 dark:border-zinc-800 rounded-xl">
                            <Layers className="size-10 mx-auto text-zinc-400 dark:text-zinc-650" />
                            <p className="text-sm mt-3 font-semibold text-zinc-500">No Epics Created Yet</p>
                            <p className="text-xs mt-1 text-zinc-400">Epics help organize related backlog items into cohesive streams of work.</p>
                        </div>
                    ) : (
                        epics.map((epic) => {
                            const epicTasks = tasks.filter(t => t.epicId === epic.id);
                            const completedTasks = epicTasks.filter(t => t.status === 'DONE');
                            const totalPoints = epicTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
                            const completedPoints = completedTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
                            const percent = epicTasks.length > 0 ? Math.round((completedTasks.length / epicTasks.length) * 100) : 0;

                            return (
                                <div key={epic.id} className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-xs flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2.5">
                                            <span style={{ backgroundColor: epic.color }} className="w-3 h-3 rounded-full shadow-xs" />
                                            <h3 className="font-bold text-sm">{epic.name}</h3>
                                        </div>
                                        <button onClick={() => handleDeleteEpic(epic.id)} className="text-zinc-400 hover:text-red-500 cursor-pointer p-1">
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                    {epic.description && (
                                        <p className="text-xs text-zinc-500 dark:text-zinc-450 mt-1 text-left">{epic.description}</p>
                                    )}

                                    {/* Stats grid */}
                                    <div className="grid grid-cols-3 gap-2 mt-4 text-xs bg-zinc-50 dark:bg-zinc-950/60 p-2.5 rounded border border-zinc-150 dark:border-zinc-850">
                                        <div>
                                            <span className="block text-zinc-400 text-[10px] uppercase">Tasks Complete</span>
                                            <span className="font-bold">{completedTasks.length} / {epicTasks.length}</span>
                                        </div>
                                        <div>
                                            <span className="block text-zinc-400 text-[10px] uppercase">Points Complete</span>
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{completedPoints} / {totalPoints} SP</span>
                                        </div>
                                        <div>
                                            <span className="block text-zinc-400 text-[10px] uppercase">Progress</span>
                                            <span className="font-bold">{percent}%</span>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="w-full bg-zinc-150 dark:bg-zinc-800 h-1.5 rounded-full mt-4 overflow-hidden">
                                        <div style={{ width: `${percent}%`, backgroundColor: epic.color }} className="h-full rounded-full transition-all duration-500" />
                                    </div>

                                    {/* Linked tasks dropdown selector */}
                                    <div className="mt-4 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold block mb-2 text-left">Linked Tasks:</span>
                                        {epicTasks.length === 0 ? (
                                            <p className="text-xs text-zinc-400 text-left">No tasks linked. Link tasks from the sidebar.</p>
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
                        })
                    )}
                </div>
            </div>

            {/* Right Column: Unmapped Tasks list for easy assignment */}
            <div className="bg-white dark:bg-zinc-900/60 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col h-[600px]">
                <h3 className="font-bold text-sm flex items-center gap-2 border-b border-zinc-250 dark:border-zinc-800 pb-3">
                    <CheckSquare className="size-4 text-blue-500" />
                    Unmapped Backlog Tasks
                </h3>
                <div className="flex-1 overflow-y-auto space-y-2 mt-4 pr-1">
                    {tasks.filter(t => !t.epicId).length === 0 ? (
                        <p className="text-xs text-zinc-400 text-center mt-20">All tasks have been mapped to Epics!</p>
                    ) : (
                        tasks.filter(t => !t.epicId).map(task => (
                            <div key={task.id} className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-left space-y-2">
                                <p className="text-xs font-semibold line-clamp-2">{task.title}</p>
                                <div className="flex justify-between items-center pt-1 border-t border-zinc-150 dark:border-zinc-850">
                                    <span className="text-[10px] text-zinc-500 font-bold bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{task.storyPoints || 0} SP</span>
                                    <select onChange={(e) => handleAssignEpic(task.id, e.target.value)} defaultValue="" className="text-[10px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-1 py-0.5 max-w-[120px] font-medium outline-none cursor-pointer">
                                        <option value="" disabled>Link Epic...</option>
                                        {epics.map(e => (
                                            <option key={e.id} value={e.id}>{e.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
