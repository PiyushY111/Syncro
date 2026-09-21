import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { Presentation, Plus, ArrowLeft, Trash2, Folder, Star } from 'lucide-react';
import api from '@/configs/api';
import WhiteboardCanvas from '@/components/project/whiteboard/WhiteboardCanvas';
import { CreateBoardModal, ConfirmDeleteModal } from '@/components/project/whiteboardView/WhiteboardModals';
import { useAuth } from '@/context/AuthContext';
import { getUserWorkspaceRole, canManageWhiteboards } from '@/utils/permissions';

export default function WhiteboardsPage() {
    const currentWorkspace = useSelector((state) => state.workspace.currentWorkspace);
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const boardId = searchParams.get('id');

    const [boards, setBoards] = useState([]);
    const [activeBoard, setActiveBoard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [boardToDelete, setBoardToDelete] = useState(null);

    const currentUserRole = getUserWorkspaceRole(currentWorkspace, user?.id);
    const canManage = canManageWhiteboards(currentUserRole, currentWorkspace);

    const loadBoards = useCallback(() => {
        if (!currentWorkspace?.id) return;
        api.get(`/api/whiteboards/workspace/${currentWorkspace.id}`)
            .then(({ data }) => setBoards(data))
            .catch(err => console.error("Load failed", err))
            .finally(() => setLoading(false));
    }, [currentWorkspace?.id]);

    useEffect(() => { loadBoards(); }, [loadBoards]);

    useEffect(() => {
        if (boards.length > 0 && boardId) {
            const found = boards.find(b => b.id === boardId);
            if (found) setActiveBoard(found);
        } else if (!boardId) setActiveBoard(null);
    }, [boardId, boards]);

    const submitCreateBoard = (name, projectId, isPrivate) => {
        api.post('/api/whiteboards', { projectId: projectId || null, workspaceId: currentWorkspace.id, name, isPrivate })
            .then(({ data }) => {
                setBoards([data, ...boards]);
                setSearchParams({ id: data.id });
                setIsCreateOpen(false);
            }).catch(err => console.error("Create failed", err));
    };

    const submitDeleteBoard = () => {
        if (!boardToDelete) return;
        api.delete(`/api/whiteboards/${boardToDelete.id}`)
            .then(() => {
                setBoards(boards.filter(b => b.id !== boardToDelete.id));
                if (activeBoard?.id === boardToDelete.id) setSearchParams({});
                setBoardToDelete(null);
            }).catch(err => console.error("Delete failed", err));
    };

    const handleToggleStar = (e, bId) => {
        e.stopPropagation();
        api.put(`/api/whiteboards/${bId}/star`)
            .then(({ data }) => {
                setBoards(boards.map(b => b.id === bId ? { ...b, isStarred: data.isStarred } : b));
            }).catch(err => console.error("Star failed", err));
    };

    if (activeBoard) {
        const proj = currentWorkspace?.projects?.find(p => p.id === activeBoard.projectId) || {};
        return (
            <div className="space-y-4 text-left max-w-6xl mx-auto px-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => setSearchParams({})} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg shadow-sm">
                        <ArrowLeft className="size-4" /> Back to Whiteboards
                    </button>
                    <span className="text-sm font-semibold text-zinc-400">/</span>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        {activeBoard.name} 
                        {proj.name && <span className="text-xs font-normal bg-zinc-100 dark:bg-zinc-850 px-2 py-0.5 rounded text-zinc-500 flex items-center gap-1"><Folder className="size-3" />{proj.name}</span>}
                    </h2>
                </div>
                <WhiteboardCanvas whiteboardId={activeBoard.id} projectId={activeBoard.projectId} tasks={proj.tasks || []} />
            </div>
        );
    }

    const sortedBoards = [...boards].sort((a, b) => (b.isStarred ? 1 : 0) - (a.isStarred ? 1 : 0) || new Date(b.createdAt) - new Date(a.createdAt));

    return (
        <div className="max-w-6xl mx-auto px-4 text-zinc-900 dark:text-white">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 text-left relative shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <Presentation className="size-5 text-blue-500" /><h2 className="text-xl font-bold">Workspace Whiteboards</h2>
                    </div>
                    {canManage && (
                        <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer shadow-sm"><Plus className="size-4" /> New Whiteboard</button>
                    )}
                </div>

                {loading ? <div className="text-center py-10 text-zinc-500">Loading boards...</div> : sortedBoards.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                        <Presentation className="size-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                        <p className="text-zinc-500 dark:text-zinc-400 font-medium">No whiteboards created yet</p>
                        {canManage && (
                            <button onClick={() => setIsCreateOpen(true)} className="mt-3 text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline">Create first board</button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {sortedBoards.map(board => (
                            <div key={board.id} onClick={() => setSearchParams({ id: board.id })} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 hover:bg-zinc-50 dark:bg-zinc-850/40 dark:hover:bg-zinc-800 transition-all cursor-pointer flex justify-between items-center group shadow-sm relative">
                                <div className="space-y-1 pr-6">
                                    <h3 className="font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-sm">{board.name}</h3>
                                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-450 dark:text-zinc-500">
                                        <Folder className="size-3 text-zinc-400" /><span className="truncate max-w-24 font-medium">{board.project?.name || 'Workspace'}</span>
                                        <span className={`px-1.5 py-0.5 rounded-full font-semibold ${board.isPrivate ? 'bg-amber-105 text-amber-700 dark:bg-amber-950/20' : 'bg-green-105 text-green-700 dark:bg-green-950/20'}`}>{board.isPrivate ? 'Private' : 'Public'}</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-450">Created: {new Date(board.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <button onClick={(e) => handleToggleStar(e, board.id)} className="p-1 cursor-pointer"><Star className={`size-4.5 ${board.isStarred ? 'text-yellow-500 fill-yellow-500' : 'text-zinc-300 dark:text-zinc-700 hover:text-yellow-500'}`} /></button>
                                    {canManage && (
                                        <button onClick={(e) => { e.stopPropagation(); setBoardToDelete(board); }} className="p-2 text-zinc-400 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><Trash2 className="size-4.5" /></button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <CreateBoardModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreate={submitCreateBoard} projects={currentWorkspace?.projects || []} />
                <ConfirmDeleteModal isOpen={!!boardToDelete} onClose={() => setBoardToDelete(null)} onConfirm={submitDeleteBoard} boardName={boardToDelete?.name || ''} />
            </div>
        </div>
    );
}
