import React, { useState, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/configs/api';
import { MessageSquare, ThumbsUp, Trash2, Plus, Sparkles, MessageCircle, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SprintRetro({ project }) {
    const { socket } = useSocket();
    const { token, user: currentUser } = useAuth();

    // Find active sprint or fallback to the latest completed sprint
    const activeSprint = project?.sprints?.find(s => s.status === 'ACTIVE') || project?.sprints?.find(s => s.status === 'COMPLETED');
    
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newCardTexts, setNewCardTexts] = useState({});

    useEffect(() => {
        if (!activeSprint) return;

        // Load columns and items
        const loadRetroBoard = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/api/retros/sprints/${activeSprint.id}`, { headers: { Authorization: `Bearer ${token}` } });
                setColumns(data.columns || []);
            } catch (error) {
                console.error("Failed to load retro board:", error);
            } finally {
                setLoading(false);
            }
        };

        loadRetroBoard();

        // Join retro socket room
        if (socket) {
            socket.emit("retro:join", activeSprint.id);

            socket.on("retro:item_added", (newItem) => {
                setColumns(prev => prev.map(col => {
                    if (col.id === newItem.columnId) {
                        return {
                            ...col,
                            items: [...col.items.filter(item => item.id !== newItem.id), newItem].sort((a, b) => b.votes - a.votes)
                        };
                    }
                    return col;
                }));
            });

            socket.on("retro:item_voted", (updatedItem) => {
                setColumns(prev => prev.map(col => {
                    if (col.id === updatedItem.columnId) {
                        return {
                            ...col,
                            items: col.items.map(item => item.id === updatedItem.id ? updatedItem : item).sort((a, b) => b.votes - a.votes)
                        };
                    }
                    return col;
                }));
            });

            socket.on("retro:item_deleted", ({ itemId }) => {
                setColumns(prev => prev.map(col => ({
                    ...col,
                    items: col.items.filter(item => item.id !== itemId)
                })));
            });
        }

        return () => {
            if (socket) {
                socket.emit("retro:leave", activeSprint.id);
                socket.off("retro:item_added");
                socket.off("retro:item_voted");
                socket.off("retro:item_deleted");
            }
        };
    }, [activeSprint?.id, socket, token]);

    const handleInitializeRetro = async () => {
        try {
            setLoading(true);
            const { data } = await api.post(`/api/retros/sprints/${activeSprint.id}/initialize`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setColumns(data.columns || []);
            toast.success('Retro board initialized!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to initialize retro board');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCard = async (e, columnId) => {
        e.preventDefault();
        const text = newCardTexts[columnId] || '';
        if (!text.trim()) return;

        try {
            const { data } = await api.post(`/api/retros/columns/${columnId}/items`, { content: text.trim() }, { headers: { Authorization: `Bearer ${token}` } });
            
            // Socket event will automatically update this for everyone including the sender,
            // but we can optimistic-append or update state just in case sockets are laggy
            setColumns(prev => prev.map(col => {
                if (col.id === columnId) {
                    return {
                        ...col,
                        items: [...col.items.filter(item => item.id !== data.item.id), data.item].sort((a, b) => b.votes - a.votes)
                    };
                }
                return col;
            }));

            setNewCardTexts(prev => ({ ...prev, [columnId]: '' }));
            toast.success('Card added');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add card');
        }
    };

    const handleVote = async (itemId) => {
        try {
            const { data } = await api.put(`/api/retros/items/${itemId}/vote`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setColumns(prev => prev.map(col => {
                if (col.id === data.item.columnId) {
                    return {
                        ...col,
                        items: col.items.map(item => item.id === itemId ? data.item : item).sort((a, b) => b.votes - a.votes)
                    };
                }
                return col;
            }));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to vote');
        }
    };

    const handleDeleteCard = async (itemId, columnId) => {
        if (!window.confirm('Delete this feedback card?')) return;
        try {
            await api.delete(`/api/retros/items/${itemId}`, { headers: { Authorization: `Bearer ${token}` } });
            setColumns(prev => prev.map(col => {
                if (col.id === columnId) {
                    return {
                        ...col,
                        items: col.items.filter(item => item.id !== itemId)
                    };
                }
                return col;
            }));
            toast.success('Card deleted');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete card');
        }
    };

    if (!activeSprint) {
        return (
            <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-16 text-center text-zinc-500 max-w-4xl mx-auto mt-10">
                <MessageSquare className="size-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-4 animate-pulse" />
                <h3 className="text-lg font-bold text-zinc-750 dark:text-zinc-250">No Sprint Retro Available</h3>
                <p className="text-sm text-zinc-400 mt-2 max-w-md mx-auto">Sprint retrospectives run on active or completed sprints. Start a sprint to enable the retro board.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 text-zinc-900 dark:text-white text-left">
            <div className="bg-white dark:bg-zinc-900/60 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <MessageSquare className="size-5 text-indigo-500" />
                        Sprint Retrospective: {activeSprint.name}
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Reflect on the sprint cycle as a team. Add feedback and upvote items in real-time.</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-xs text-zinc-450">Loading retro board...</div>
            ) : columns.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-16 text-center max-w-xl mx-auto mt-10">
                    <Sparkles className="size-10 mx-auto text-indigo-450 mb-3" />
                    <h3 className="text-sm font-bold">Retro Board Not Initialized</h3>
                    <p className="text-xs text-zinc-400 mt-2">Initialize standard column categories (What went well, What can be improved, Action Items) to begin.</p>
                    <button onClick={handleInitializeRetro} className="mt-5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold cursor-pointer">
                        Initialize Retro Board
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {columns.map(column => {
                        const isActionItem = column.title.toLowerCase().includes('action');
                        const isImpr = column.title.toLowerCase().includes('improve');
                        
                        const colColor = isActionItem 
                            ? 'border-indigo-200 dark:border-indigo-950/80 bg-indigo-50/10 dark:bg-indigo-950/5'
                            : isImpr
                                ? 'border-amber-200 dark:border-amber-950/80 bg-amber-50/10 dark:bg-amber-950/5'
                                : 'border-emerald-200 dark:border-emerald-950/80 bg-emerald-50/10 dark:bg-emerald-950/5';

                        const headerColor = isActionItem 
                            ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10'
                            : isImpr
                                ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
                                : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10';

                        return (
                            <div key={column.id} className={`border rounded-xl p-4 flex flex-col h-[550px] ${colColor}`}>
                                {/* Column Header */}
                                <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60 dark:border-zinc-800 mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${headerColor}`}>{column.title}</span>
                                        <span className="text-xs text-zinc-450 font-bold">({column.items?.length || 0})</span>
                                    </div>
                                </div>

                                {/* Add Card Form */}
                                <form onSubmit={(e) => handleAddCard(e, column.id)} className="mb-4">
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={newCardTexts[column.id] || ''} 
                                            onChange={(e) => setNewCardTexts(prev => ({ ...prev, [column.id]: e.target.value }))}
                                            placeholder="Share feedback..." 
                                            className="flex-1 text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-2 focus:ring-1 focus:ring-blue-500 outline-none" 
                                        />
                                        <button type="submit" className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer">
                                            <Plus className="size-3.5" />
                                        </button>
                                    </div>
                                </form>

                                {/* Column Cards */}
                                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                                    {column.items?.length === 0 ? (
                                        <p className="text-xs text-zinc-450 italic text-center mt-12">No cards yet. Add the first card!</p>
                                    ) : (
                                        column.items.map(item => {
                                            const hasVoted = item.voters?.includes(currentUser?.id);

                                            return (
                                                <div key={item.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-3 rounded-lg shadow-xs space-y-3 transition-all">
                                                    <p className="text-xs text-left leading-relaxed">{item.content}</p>
                                                    <div className="flex justify-between items-center pt-2.5 border-t border-zinc-100 dark:border-zinc-850 text-[10px]">
                                                        {/* User signature */}
                                                        <span className="text-zinc-500 font-semibold flex items-center gap-1.5">
                                                            <span className="size-4 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center font-bold text-[8px]">
                                                                {item.user?.name ? item.user.name[0].toUpperCase() : '?'}
                                                            </span>
                                                            {item.user?.name || 'Anonymous'}
                                                        </span>

                                                        <div className="flex items-center gap-2">
                                                            {/* Vote Button */}
                                                            <button 
                                                                onClick={() => handleVote(item.id)} 
                                                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer transition-all border ${hasVoted ? 'bg-blue-50 dark:bg-blue-950/45 border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 font-bold' : 'border-zinc-200 dark:border-zinc-800 text-zinc-450 hover:text-zinc-200'}`}
                                                            >
                                                                <ThumbsUp className="size-3" />
                                                                <span>{item.votes}</span>
                                                            </button>

                                                            {/* Delete Button */}
                                                            {item.userId === currentUser?.id && (
                                                                <button 
                                                                    onClick={() => handleDeleteCard(item.id, column.id)} 
                                                                    className="text-zinc-400 hover:text-red-500 cursor-pointer p-0.5"
                                                                >
                                                                    <Trash2 className="size-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
