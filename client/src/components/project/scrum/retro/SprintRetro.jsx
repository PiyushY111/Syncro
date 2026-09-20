import React, { useEffect, useState } from 'react';
import { MessageSquare, Users } from 'lucide-react';
import io from 'socket.io-client';
import api from '@/configs/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

import RetroColumnView from './RetroColumnView';

export default function SprintRetro({ project }) {
    const { user } = useAuth();
    const sprints = project?.sprints || [];
    const [selectedSprintId, setSelectedSprintId] = useState(sprints.find(s => s.status === 'ACTIVE')?.id || '');
    const [socket, setSocket] = useState(null);
    const [columns, setColumns] = useState([]);
    const [activeRoomUsers, setActiveRoomUsers] = useState(0);

    const activeSprints = sprints.filter(s => s.status === 'ACTIVE' || s.status === 'COMPLETED');

    useEffect(() => {
        if (!user) return undefined;
        const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        const socketInstance = io(socketUrl, { withCredentials: true });
        setSocket(socketInstance);
        return () => { socketInstance.disconnect(); };
    }, [user]);

    useEffect(() => {
        if (!selectedSprintId || !socket) return;
        
        socket.emit('retro:join', { sprintId: selectedSprintId });
        
        const loadRetroBoard = async () => {
            try {
                const { data } = await api.get(`/api/retros/sprint/${selectedSprintId}`);
                setColumns(data.columns || []);
            } catch {
                toast.error('Failed to load Retrospective board');
            }
        };
        loadRetroBoard();

        socket.on('retro:update', (updatedColumns) => {
            setColumns(updatedColumns);
        });

        socket.on('retro:presence', ({ count }) => {
            setActiveRoomUsers(count);
        });

        return () => {
            socket.emit('retro:leave', { sprintId: selectedSprintId });
            socket.off('retro:update');
            socket.off('retro:presence');
        };
    }, [selectedSprintId, socket]);

    return (
        <div className="space-y-6 text-zinc-900 dark:text-white text-left">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-zinc-900/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 gap-4">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <MessageSquare className="size-5 text-indigo-500" />
                        Collaborative Sprint Retrospective
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">Reflect on the completed/active sprint with your team in real-time.</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                    {selectedSprintId && (
                        <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full font-bold">
                            <Users className="size-3.5 animate-pulse" />
                            {activeRoomUsers} Online
                        </span>
                    )}
                    <select value={selectedSprintId} onChange={(e) => setSelectedSprintId(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 cursor-pointer outline-none">
                        <option value="" disabled>Choose active/completed sprint...</option>
                        {activeSprints.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedSprintId ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {columns.map(col => (
                        <RetroColumnView key={col.id} col={col} sprintId={selectedSprintId} socket={socket} user={user} />
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-zinc-900/40 p-12 text-center border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400">
                    <MessageSquare className="size-8 mx-auto mb-2 text-zinc-300" />
                    <p className="text-xs font-semibold">Select a Sprint to load its Retro room.</p>
                </div>
            )}
        </div>
    );
}
