import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Plus, Layers } from 'lucide-react';
import api from '@/configs/api';
import { useAuth } from '@/context/AuthContext';
import { addEpic } from '@/features/workspaceSlice';
import toast from 'react-hot-toast';

import EpicCard from './EpicCard';
import EpicListSidebar from './EpicListSidebar';

export default function EpicMapping({ project, tasks }) {
    const { token } = useAuth();
    const dispatch = useDispatch();
    const epics = project?.epics || [];

    const [showCreate, setShowCreate] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#8B5CF6');

    const colors = [
        { hex: '#8B5CF6', label: 'Purple' },
        { hex: '#3B82F6', label: 'Blue' },
        { hex: '#10B981', label: 'Green' },
        { hex: '#F59E0B', label: 'Amber' },
        { hex: '#EF4444', label: 'Red' },
        { hex: '#EC4899', label: 'Pink' }
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

            dispatch(addEpic({ projectId: project.id, epic: data.epic || data.data?.epic }));
            toast.success('Epic created successfully');
            setName('');
            setDescription('');
            setShowCreate(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create Epic');
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-zinc-900 dark:text-white text-left">
            <div className="md:col-span-2 space-y-6">
                <div className="flex justify-between items-center bg-white dark:bg-zinc-900/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div>
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Layers className="size-5 text-indigo-500" />
                            Epics & Feature Maps
                        </h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-405 mt-1">Group your tasks into high-level features and track their completion.</p>
                    </div>
                    <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold cursor-pointer">
                        <Plus className="size-3.5" /> New Epic
                    </button>
                </div>

                {showCreate && (
                    <form onSubmit={handleCreateEpic} className="bg-zinc-50 dark:bg-zinc-900/80 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                        <h3 className="text-sm font-semibold">Create New Epic</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Epic Name" className="w-full text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-2" required />
                            <div className="flex gap-2 items-center">
                                {colors.map((c) => (
                                    <button key={c.hex} type="button" onClick={() => setColor(c.hex)} style={{ backgroundColor: c.hex }} className={`size-5 rounded-full border cursor-pointer ${color === c.hex ? 'border-zinc-900 dark:border-white scale-110' : 'border-transparent'}`} />
                                ))}
                            </div>
                        </div>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={2} className="w-full text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-2" />
                        <div className="flex justify-end gap-2 text-xs">
                            <button type="button" onClick={() => setShowCreate(false)} className="px-3 py-1.5 border border-zinc-250 dark:border-zinc-800 rounded">Cancel</button>
                            <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded font-semibold">Create</button>
                        </div>
                    </form>
                )}

                <div className="space-y-4">
                    {epics.length === 0 ? (
                        <p className="text-xs text-zinc-400 text-center py-12">No Epics created yet.</p>
                    ) : (
                        epics.map(epic => (
                            <EpicCard key={epic.id} project={project} epic={epic} tasks={tasks} />
                        ))
                    )}
                </div>
            </div>

            <EpicListSidebar project={project} tasks={tasks} />
        </div>
    );
}
