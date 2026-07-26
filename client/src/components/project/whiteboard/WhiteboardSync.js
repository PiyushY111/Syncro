import { useState, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import api from '@/configs/api';

export default function useWhiteboardSync(whiteboardId) {
    const { socket } = useSocket();
    const [pages, setPages] = useState([{ id: 'page-1', name: 'Page 1', nodes: [], edges: [], drawings: [] }]);
    const [currentPageId, setCurrentPageId] = useState('page-1');
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
    const [drawings, setDrawings] = useState([]);
    const [cursors, setCursors] = useState({});
    const [saving, setSaving] = useState(false);
    const [history, setHistory] = useState({ past: [], future: [] });

    // Initial Load
    useEffect(() => {
        if (!whiteboardId) return;
        api.get(`/api/whiteboards/${whiteboardId}`).then(({ data }) => {
            const dbPages = typeof data.pages === 'string' ? JSON.parse(data.pages) : (data.pages || []);
            const validPages = dbPages.length > 0 ? dbPages : [{ id: 'page-1', name: 'Page 1', nodes: [], edges: [], drawings: [] }];
            setPages(validPages);
            const activeId = data.currentPageId || validPages[0].id;
            setCurrentPageId(activeId);
            const active = validPages.find(p => p.id === activeId) || validPages[0];
            setNodes(active.nodes || []); setEdges(active.edges || []); setDrawings(active.drawings || []);
            const parsedData = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
            setViewport(parsedData.viewport || { x: 0, y: 0, zoom: 1 });
        });
    }, [whiteboardId]);

    // Socket sync
    useEffect(() => {
        if (!socket || !whiteboardId) return;
        socket.emit("whiteboard:join", whiteboardId);
        socket.on("whiteboard:updated", ({ pages: newPages, currentPageId: nextCurPageId }) => {
            if (newPages) {
                setPages(newPages);
                const active = newPages.find(p => p.id === (nextCurPageId || currentPageId));
                if (active) {
                    setNodes(active.nodes || []); setEdges(active.edges || []); setDrawings(active.drawings || []);
                }
            }
        });
        socket.on("whiteboard:cursor_moved", ({ userId, userName, x, y }) => {
            setCursors(prev => ({ ...prev, [userId]: { userName, x, y } }));
        });
        return () => {
            socket.emit("whiteboard:leave", whiteboardId);
            socket.off("whiteboard:updated"); socket.off("whiteboard:cursor_moved");
        };
    }, [socket, whiteboardId, currentPageId]);

    // Auto-save
    useEffect(() => {
        if (!whiteboardId || pages.length === 0) return;
        const timer = setTimeout(async () => {
            setSaving(true);
            try {
                const currentPages = pages.map(p => p.id === currentPageId ? { ...p, nodes, edges, drawings } : p);
                await api.put(`/api/whiteboards/${whiteboardId}`, {
                    pages: currentPages, currentPageId, data: { viewport }
                });
            } catch (err) { console.error("Autosave failed", err); }
            setSaving(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, [nodes, edges, viewport, drawings, pages, currentPageId, whiteboardId]);

    const broadcast = (newNodes, newEdges, newDrawings, newPages) => {
        const activePages = newPages || pages.map(p => p.id === currentPageId ? { ...p, nodes: newNodes || nodes, edges: newEdges || edges, drawings: newDrawings || drawings } : p);
        socket?.emit("whiteboard:update", { whiteboardId, pages: activePages, currentPageId });
        if (newPages) setPages(newPages);
    };

    const pushHistory = (state) => {
        setHistory(prev => ({ past: [...prev.past.slice(-30), JSON.parse(JSON.stringify(state))], future: [] }));
    };

    const undo = () => {
        if (history.past.length === 0) return;
        const prev = history.past[history.past.length - 1];
        const current = pages.map(p => p.id === currentPageId ? { ...p, nodes, edges, drawings } : p);
        setHistory({ past: history.past.slice(0, -1), future: [current, ...history.future] });
        const active = prev.find(p => p.id === currentPageId) || prev[0];
        setNodes(active.nodes || []); setEdges(active.edges || []); setDrawings(active.drawings || []);
        broadcast(active.nodes, active.edges, active.drawings, prev);
    };

    const redo = () => {
        if (history.future.length === 0) return;
        const next = history.future[0];
        const current = pages.map(p => p.id === currentPageId ? { ...p, nodes, edges, drawings } : p);
        setHistory({ past: [...history.past, current], future: history.future.slice(1) });
        const active = next.find(p => p.id === currentPageId) || next[0];
        setNodes(active.nodes || []); setEdges(active.edges || []); setDrawings(active.drawings || []);
        broadcast(active.nodes, active.edges, active.drawings, next);
    };

    return {
        pages, setPages, currentPageId, setCurrentPageId,
        nodes, setNodes, edges, setEdges, viewport, setViewport, drawings, setDrawings,
        cursors, saving, broadcast, pushHistory, undo, redo, history
    };
}
