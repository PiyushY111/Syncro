import React from 'react';
import { ThumbsUp, Trash2 } from 'lucide-react';
import api from '@/configs/api';
import toast from 'react-hot-toast';

export default function RetroCard({ item, sprintId, socket, user }) {
    const isOwner = item.authorId === user?.id;
    const hasVoted = item.votes?.some(v => v.userId === user?.id);

    const handleToggleVote = async () => {
        try {
            await api.put(`/api/retros/items/${item.id}/vote`, {});
            socket.emit('retro:action', { sprintId });
        } catch {
            toast.error('Failed to vote');
        }
    };

    const handleDeleteCard = async () => {
        if (!window.confirm('Delete this card?')) return;
        try {
            await api.delete(`/api/retros/items/${item.id}`);
            socket.emit('retro:action', { sprintId });
            toast.success('Card deleted');
        } catch {
            toast.error('Failed to delete card');
        }
    };

    return (
        <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-850 space-y-2 text-left relative group">
            <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 pr-4">{item.content}</p>
            
            <div className="flex justify-between items-center text-[10px] text-zinc-400">
                <span className="truncate max-w-[60%] italic">By: {item.author?.name || 'Anonymous'}</span>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleToggleVote} 
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                            hasVoted 
                                ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold' 
                                : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400'
                        }`}
                    >
                        <ThumbsUp className="size-2.5" />
                        <span>{item.votes?.length || 0}</span>
                    </button>

                    {isOwner && (
                        <button onClick={handleDeleteCard} className="text-zinc-400 hover:text-red-500 cursor-pointer p-0.5">
                            <Trash2 className="size-3" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
