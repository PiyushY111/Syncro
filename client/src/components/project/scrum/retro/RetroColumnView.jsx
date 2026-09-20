import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import api from '@/configs/api';
import toast from 'react-hot-toast';

import RetroCard from './RetroCard';

export default function RetroColumnView({ col, sprintId, socket, user }) {
    const [cardText, setCardText] = useState('');

    const handleAddCard = async (e) => {
        e.preventDefault();
        if (!cardText.trim()) return;
        try {
            await api.post(`/api/retros/columns/${col.id}/items`, {
                content: cardText.trim()
            });

            socket.emit('retro:action', { sprintId });
            setCardText('');
            toast.success('Card added');
        } catch {
            toast.error('Failed to add retro card');
        }
    };

    return (
        <div style={{ borderColor: col.color }} className="bg-white dark:bg-zinc-900/40 p-4 rounded-xl border-t-4 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col h-[520px]">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-150 dark:border-zinc-850 mb-4">
                <h3 className="font-bold text-sm">{col.title}</h3>
                <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-550 px-2 py-0.5 rounded font-bold">
                    {col.items?.length || 0}
                </span>
            </div>

            <form onSubmit={handleAddCard} className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={cardText}
                    onChange={(e) => setCardText(e.target.value)}
                    placeholder="Add card..."
                    className="flex-1 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1.5 outline-none"
                />
                <button type="submit" className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded p-1.5 cursor-pointer">
                    <Plus className="size-4" />
                </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[380px]">
                {col.items?.length === 0 ? (
                    <p className="text-xs text-zinc-400 text-center py-12 italic">No notes added yet.</p>
                ) : (
                    col.items?.map(item => (
                        <RetroCard key={item.id} item={item} sprintId={sprintId} socket={socket} user={user} />
                    ))
                )}
            </div>
        </div>
    );
}
