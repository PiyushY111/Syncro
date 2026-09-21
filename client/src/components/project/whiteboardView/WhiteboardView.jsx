import { useState, useEffect, useCallback, useRef } from 'react';
import { Presentation, Plus, ArrowLeft, Trash2 } from 'lucide-react';
import api from '@/configs/api';
import WhiteboardCanvas from '../whiteboard/WhiteboardCanvas';
import { CreateBoardModal, ConfirmDeleteModal } from './WhiteboardModals';

export default function WhiteboardView({ projectId, tasks }) {
    const [boards, setBoards] = useState([]);
    const [activeBoardId, setActiveBoardId] = useState(null);
    const [loading, setLoading] = useState(true);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [boardToDelete, setBoardToDelete] = useState(null);

    // Read via a ref so loadBoards' identity only depends on projectId
    // (matching the original effect's trigger) without reading a stale
    // activeBoardId from a captured closure.
    const activeBoardIdRef = useRef(activeBoardId);
    useEffect(() => {
        activeBoardIdRef.current = activeBoardId;
    }, [activeBoardId]);

    const loadBoards = useCallback(async () => {
        try {
            const { data } = await api.get(`/api/whiteboards/project/${projectId}`);
            setBoards(data);
            if (data.length === 1 && !activeBoardIdRef.current) setActiveBoardId(data[0].id);
        } catch (err) { console.error("Failed to load whiteboards", err); }
        finally { setLoading(false); }
    }, [projectId]);

    useEffect(() => { loadBoards(); }, [loadBoards]);

    const submitCreateBoard = async (name) => {
        try {
            const { data } = await api.post('/api/whiteboards', { projectId, name });
            setBoards([data, ...boards]);
            setActiveBoardId(data.id);
            setIsCreateOpen(false);
        } catch (err) { console.error("Failed to create whiteboard", err); }
    };

    const submitDeleteBoard = async () => {
        if (!boardToDelete) return;
        try {
            await api.delete(`/api/whiteboards/${boardToDelete.id}`);
            setBoards(boards.filter(b => b.id !== boardToDelete.id));
            if (activeBoardId === boardToDelete.id) setActiveBoardId(null);
            setBoardToDelete(null);
        } catch (err) { console.error("Failed to delete whiteboard", err); }
    };

    if (activeBoardId) {
        return (
            <div className="space-y-4 text-left">
                <div className="flex items-center gap-3">
                    <button onClick={() => setActiveBoardId(null)} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg shadow-sm">
                        <ArrowLeft className="size-4" /> Back to Boards
                    </button>
                    <span className="text-sm font-semibold text-zinc-400">/</span>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                        {boards.find(b => b.id === activeBoardId)?.name || 'Whiteboard'}
                    </h2>
                </div>
                <WhiteboardCanvas whiteboardId={activeBoardId} projectId={projectId} tasks={tasks} />
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 text-left relative">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <Presentation className="size-5 text-blue-500" />
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Project Whiteboards</h2>
                </div>
                <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer shadow-sm">
                    <Plus className="size-4" /> New Whiteboard
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-zinc-500">Loading boards...</div>
            ) : boards.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                    <Presentation className="size-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium">No whiteboards created yet</p>
                    <button onClick={() => setIsCreateOpen(true)} className="mt-3 text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                        Create your first board
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {boards.map(board => (
                        <div key={board.id} onClick={() => setActiveBoardId(board.id)} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 hover:bg-zinc-50 dark:bg-zinc-850/40 dark:hover:bg-zinc-800 transition-all cursor-pointer flex justify-between items-center group shadow-sm">
                            <div>
                                <h3 className="font-bold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{board.name}</h3>
                                <p className="text-xs text-zinc-450 dark:text-zinc-500 mt-1">Created: {new Date(board.createdAt).toLocaleDateString()}</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setBoardToDelete(board); }} className="p-2 text-zinc-400 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Trash2 className="size-4.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <CreateBoardModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreate={submitCreateBoard} />
            <ConfirmDeleteModal isOpen={!!boardToDelete} onClose={() => setBoardToDelete(null)} onConfirm={submitDeleteBoard} boardName={boardToDelete?.name || ''} />
        </div>
    );
}
