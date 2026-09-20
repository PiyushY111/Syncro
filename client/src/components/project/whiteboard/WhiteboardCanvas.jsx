import { useState, useRef, useEffect } from 'react';
import { Maximize2, Minimize2, Share2, Trash2, Undo, Redo, Download, ArrowUp, ArrowDown } from 'lucide-react';
import { useSocket } from '@/context/SocketContext';
import useWhiteboardSync from './WhiteboardSync';
import WhiteboardToolbar from './WhiteboardToolbar';
import WhiteboardNode from './WhiteboardNode';
import WhiteboardConnections from './WhiteboardConnections';
import WhiteboardTaskList from './WhiteboardTaskList';
import WhiteboardPageControls from '../whiteboardView/WhiteboardPageControls';
import { ShareBoardModal } from '../whiteboardView/ShareBoardModal';

export default function WhiteboardCanvas({ whiteboardId, tasks }) {
    const { socket } = useSocket();
    const canvasRef = useRef(null);
    const { pages, currentPageId, setCurrentPageId, nodes, setNodes, edges, setEdges, viewport, setViewport, drawings, setDrawings, cursors, saving, broadcast, pushHistory, undo, redo, history } = useWhiteboardSync(whiteboardId);

    const [tool, setTool] = useState('select');
    const [color, setColor] = useState('yellow');
    const [selectedNodeIds, setSelectedNodeIds] = useState([]);
    const [showTasks, setShowTasks] = useState(false);
    const [zenMode, setZenMode] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [activeDrawPath, setActiveDrawPath] = useState(null);
    const [selStart, setSelStart] = useState(null);
    const [selEnd, setSelEnd] = useState(null);

    const getCoords = (e) => {
        const r = canvasRef.current.getBoundingClientRect();
        return { x: (e.clientX - r.left - viewport.x) / viewport.zoom, y: (e.clientY - r.top - viewport.y) / viewport.zoom };
    };

    const handleMouseDown = (e) => {
        const coords = getCoords(e);
        if (tool === 'draw') {
            pushHistory(pages.map(p => p.id === currentPageId ? { ...p, nodes, edges, drawings } : p));
            setActiveDrawPath(`M ${coords.x} ${coords.y}`);
        } else if (tool !== 'select' && tool !== 'connection' && tool !== 'eraser') {
            pushHistory(pages.map(p => p.id === currentPageId ? { ...p, nodes, edges, drawings } : p));
            const txts = { sticky: 'Sticky Note', rect: 'Rectangle', circle: 'Circle', diamond: 'Diamond', text: 'Text' };
            const u = [...nodes, { id: crypto.randomUUID(), type: tool, x: coords.x - 75, y: coords.y - 50, color, text: txts[tool] || 'Shape' }];
            setNodes(u); broadcast(u); setTool('select');
        } else if (e.button === 1 || e.target === canvasRef.current || e.target.tagName === 'svg' || e.target.tagName === 'rect') {
            if (tool === 'select' && e.button === 0) { setSelStart(coords); setSelEnd(coords); setSelectedNodeIds([]); }
            else { setIsPanning(true); setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y }); }
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
            const isCmd = e.ctrlKey || e.metaKey;
            if (isCmd && e.key === 'z') { e.preventDefault(); undo(); }
            else if (isCmd && e.key === 'y') { e.preventDefault(); redo(); }
            else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeIds.length > 0) {
                pushHistory(pages.map(p => p.id === currentPageId ? { ...p, nodes, edges, drawings } : p));
                const un = nodes.filter(n => !selectedNodeIds.includes(n.id));
                const ue = edges.filter(e => !selectedNodeIds.includes(e.fromId) && !selectedNodeIds.includes(e.toId));
                setNodes(un); setEdges(ue); setSelectedNodeIds([]); broadcast(un, ue);
            }
        };
        window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nodes, edges, drawings, pages, currentPageId, selectedNodeIds, history]);

    const handleMouseMove = (e) => {
        const coords = getCoords(e); socket?.emit("whiteboard:cursor", { whiteboardId, x: coords.x, y: coords.y });
        if (isPanning) setViewport(prev => ({ ...prev, x: e.clientX - panStart.x, y: e.clientY - panStart.y }));
        else if (activeDrawPath) setActiveDrawPath(prev => `${prev} L ${coords.x} ${coords.y}`);
        else if (selStart) setSelEnd(coords);
    };

    const handleMouseUp = () => {
        setIsPanning(false);
        if (activeDrawPath) {
            const u = [...drawings, { id: crypto.randomUUID(), path: activeDrawPath, color }];
            setDrawings(u); setActiveDrawPath(null); broadcast(null, null, u);
        } else if (selStart && selEnd) {
            const x1 = Math.min(selStart.x, selEnd.x), x2 = Math.max(selStart.x, selEnd.x);
            const y1 = Math.min(selStart.y, selEnd.y), y2 = Math.max(selStart.y, selEnd.y);
            const inside = nodes.filter(n => {
                const s = n.type === 'task' ? { w: 220, h: 120 } : { w: n.width || 150, h: n.height || 100 };
                return n.x + s.w/2 >= x1 && n.x + s.w/2 <= x2 && n.y + s.h/2 >= y1 && n.y + s.h/2 <= y2;
            }).map(n => n.id);
            setSelectedNodeIds(inside); setSelStart(null); setSelEnd(null);
        }
    };

    const handleLayer = (action) => {
        if (selectedNodeIds.length === 0) return;
        const idx = nodes.findIndex(n => n.id === selectedNodeIds[0]); if (idx === -1) return;
        pushHistory(pages.map(p => p.id === currentPageId ? { ...p, nodes, edges, drawings } : p));
        const updated = [...nodes]; const [node] = updated.splice(idx, 1);
        if (action === 'front') updated.push(node); else if (action === 'back') updated.unshift(node);
        setNodes(updated); broadcast(updated);
    };

    const exportSVG = () => {
        const el = canvasRef.current.querySelector('svg'); if (!el) return;
        const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(el)], { type: 'image/svg+xml;charset=utf-8' }));
        const a = document.createElement('a'); a.href = url; a.download = 'whiteboard.svg';
        document.body.appendChild(a); a.click(); a.remove();
    };

    const canvasClass = zenMode ? "fixed inset-0 bg-zinc-50 dark:bg-zinc-955 z-[100] h-screen w-screen flex flex-col select-none" : "relative w-full h-[65vh] bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden cursor-grab select-none";

    return (
        <div ref={canvasRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onDoubleClick={(e) => {
            if (e.target === canvasRef.current || e.target.tagName === 'svg' || e.target.tagName === 'rect') {
                const coords = getCoords(e); pushHistory(pages.map(p => p.id === currentPageId ? { ...p, nodes, edges, drawings } : p));
                const u = [...nodes, { id: crypto.randomUUID(), type: 'sticky', x: coords.x - 75, y: coords.y - 50, color, text: 'Sticky Note' }];
                setNodes(u); broadcast(u);
            }
        }} onWheel={(e) => {
            e.preventDefault(); const r = canvasRef.current.getBoundingClientRect();
            const mouseX = e.clientX - r.left, mouseY = e.clientY - r.top;
            const cx = (mouseX - viewport.x) / viewport.zoom, cy = (mouseY - viewport.y) / viewport.zoom;
            const nextZoom = Math.min(3, Math.max(0.12, viewport.zoom * (e.deltaY < 0 ? 1.08 : 0.92)));
            setViewport({ x: mouseX - cx * nextZoom, y: mouseY - cy * nextZoom, zoom: nextZoom });
        }} className={canvasClass}>
            <div className="absolute top-4 left-4 z-20 flex gap-2">
                <button onClick={() => setZenMode(!zenMode)} className="p-2 bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-md hover:bg-zinc-100 cursor-pointer">{zenMode ? <Minimize2 className="size-4.5" /> : <Maximize2 className="size-4.5" />}</button>
                <button onClick={() => setIsShareOpen(true)} className="p-2 bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-md hover:bg-zinc-100 cursor-pointer"><Share2 className="size-4.5" /></button>
                <button onClick={undo} disabled={history.past.length === 0} className="p-2 bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-md hover:bg-zinc-100 disabled:opacity-30 cursor-pointer"><Undo className="size-4.5" /></button>
                <button onClick={redo} disabled={history.future.length === 0} className="p-2 bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-md hover:bg-zinc-100 disabled:opacity-30 cursor-pointer"><Redo className="size-4.5" /></button>
                <button onClick={exportSVG} className="p-2 bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-md hover:bg-zinc-100 cursor-pointer"><Download className="size-4.5" /></button>
                {selectedNodeIds.length > 0 && (
                    <div className="flex gap-1.5 border-l border-zinc-200 dark:border-zinc-850 pl-2">
                        <button onClick={() => handleLayer('front')} className="p-2 bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-md hover:bg-zinc-100 cursor-pointer text-zinc-555"><ArrowUp className="size-4" /></button>
                        <button onClick={() => handleLayer('back')} className="p-2 bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-md hover:bg-zinc-100 cursor-pointer text-zinc-555"><ArrowDown className="size-4" /></button>
                    </div>
                )}
            </div>
            
            <div style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`, transformOrigin: '0 0', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                <svg className="absolute inset-0 size-full overflow-visible pointer-events-none">
                    <defs>
                        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="15" cy="15" r="1.2" fill="#d4d4d8" className="dark:fill-zinc-800" /></pattern>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="8.5" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" /></marker>
                    </defs>
                    <rect width="20000" height="20000" x="-10000" y="-10000" fill="url(#grid)" />
                    <WhiteboardConnections edges={edges} nodes={nodes} />
                    {drawings.map(d => (
                        <path key={d.id} d={d.path} fill="none" stroke={d.color === 'white' ? '#6b7280' : d.color} strokeWidth={tool === 'eraser' ? '12' : '3'} strokeOpacity={tool === 'eraser' ? '0.2' : '1'} className={tool === 'eraser' ? 'cursor-cell pointer-events-auto hover:stroke-red-500 hover:opacity-100' : 'pointer-events-none'} onMouseEnter={(e) => {
                            if (tool === 'eraser' && e.buttons === 1) {
                                pushHistory(pages.map(p => p.id === currentPageId ? { ...p, nodes, edges, drawings } : p));
                                const u = drawings.filter(item => item.id !== d.id); setDrawings(u); broadcast(null, null, u);
                            }
                        }} onMouseDown={(e) => {
                            if (tool === 'eraser') {
                                e.stopPropagation(); pushHistory(pages.map(p => p.id === currentPageId ? { ...p, nodes, edges, drawings } : p));
                                const u = drawings.filter(item => item.id !== d.id); setDrawings(u); broadcast(null, null, u);
                            }
                        }} />
                    ))}
                    {activeDrawPath && <path d={activeDrawPath} fill="none" stroke={color === 'white' ? '#6b7280' : color} strokeWidth="3" />}
                    {selStart && selEnd && (
                        <rect x={Math.min(selStart.x, selEnd.x)} y={Math.min(selStart.y, selEnd.y)} width={Math.abs(selEnd.x - selStart.x)} height={Math.abs(selEnd.y - selStart.y)} fill="rgba(59, 130, 246, 0.08)" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 4" />
                    )}
                </svg>

                <div className="absolute inset-0 size-full pointer-events-auto">
                    {nodes.map(n => (
                        <WhiteboardNode key={n.id} node={n} selected={selectedNodeIds.includes(n.id)} zoom={viewport.zoom} onClick={(id) => {
                            if (tool === 'connection' && selectedNodeIds.length > 0 && !selectedNodeIds.includes(id)) {
                                pushHistory(pages.map(p => p.id === currentPageId ? { ...p, nodes, edges, drawings } : p));
                                const u = [...edges, { id: crypto.randomUUID(), fromId: selectedNodeIds[0], toId: id }];
                                setEdges(u); broadcast(null, u); setSelectedNodeIds([]);
                            } else setSelectedNodeIds([id]);
                        }} onDrag={(id, x, y) => {
                            const u = nodes.map(item => item.id === id ? { ...item, x, y } : item);
                            setNodes(u); broadcast(u);
                        }} onUpdateText={(id, text) => {
                            pushHistory(pages.map(p => p.id === currentPageId ? { ...p, nodes, edges, drawings } : p));
                            const u = nodes.map(item => item.id === id ? { ...item, text } : item);
                            setNodes(u); broadcast(u);
                        }} onResize={(id, width, height) => {
                            const u = nodes.map(item => item.id === id ? { ...item, width, height } : item);
                            setNodes(u); broadcast(u);
                        }} />
                    ))}
                </div>
                {Object.entries(cursors).map(([id, peer]) => {
                    const c = `hsl(${peer.userName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360}, 80%, 50%)`;
                    return (
                        <div key={id} style={{ left: `${peer.x}px`, top: `${peer.y}px` }} className="absolute pointer-events-none z-45 flex items-center gap-1.5 transition-all duration-75">
                            <svg style={{ color: c }} className="size-5 drop-shadow-md select-none" viewBox="0 0 24 24" fill="currentColor"><path d="M4.73 3c-.24 0-.47.1-.64.27-.3.3-.33.78-.07 1.12l5.77 15.6c.26.7.99 1.1 1.7.9.6-.17 1.05-.68 1.13-1.3l1.1-7.85 7.84-1.1c.7-.1 1.2-.7 1.1-1.4-.1-.58-.5-1.03-1.07-1.14L6.15 3.32c-.1-.02-.2-.02-.3-.02z"/></svg>
                            <div style={{ backgroundColor: c }} className="text-white text-[9px] font-semibold px-2 py-0.5 rounded shadow-lg whitespace-nowrap">{peer.userName}</div>
                        </div>
                    );
                })}
            </div>
            <WhiteboardToolbar tool={tool} setTool={setTool} color={color} setColor={setColor} onDelete={() => {
                if (selectedNodeIds.length === 0) return;
                pushHistory(pages.map(p => p.id === currentPageId ? { ...p, nodes, edges, drawings } : p));
                const un = nodes.filter(n => !selectedNodeIds.includes(n.id));
                const ue = edges.filter(e => !selectedNodeIds.includes(e.fromId) && !selectedNodeIds.includes(e.toId));
                setNodes(un); setEdges(ue); setSelectedNodeIds([]); broadcast(un, ue);
            }} onAddTaskToggle={() => setShowTasks(!showTasks)} saving={saving} />
            {showTasks && <WhiteboardTaskList tasks={tasks} onClose={() => setShowTasks(false)} onAddTaskNode={(t) => {
                pushHistory(pages.map(p => p.id === currentPageId ? { ...p, nodes, edges, drawings } : p));
                const r = canvasRef.current.getBoundingClientRect();
                const u = [...nodes, { id: crypto.randomUUID(), type: 'task', x: (-viewport.x + r.width / 2) / viewport.zoom - 110, y: (-viewport.y + r.height / 2) / viewport.zoom - 60, task: t, text: t.title }];
                setNodes(u); broadcast(u); setShowTasks(false);
            }} />}
            <WhiteboardPageControls pages={pages} currentPageId={currentPageId} onSwitchPage={(id) => {
                const u = pages.map(p => p.id === currentPageId ? { ...p, nodes, edges, drawings } : p);
                const t = u.find(p => p.id === id);
                if (t) { setNodes(t.nodes || []); setEdges(t.edges || []); setDrawings(t.drawings || []); setCurrentPageId(id); broadcast(t.nodes || [], t.edges || [], t.drawings || [], u); }
            }} onCreatePage={() => {
                const u = pages.map(p => p.id === currentPageId ? { ...p, nodes, edges, drawings } : p);
                const newP = { id: `page-${crypto.randomUUID()}`, name: `Page ${pages.length + 1}`, nodes: [], edges: [], drawings: [] };
                setNodes([]); setEdges([]); setDrawings([]); setCurrentPageId(newP.id); broadcast([], [], [], [...u, newP]);
            }} onDeletePage={(id) => {
                if (pages.length <= 1) return;
                const rem = pages.filter(p => p.id !== id); const f = rem[0];
                setNodes(f.nodes || []); setEdges(f.edges || []); setDrawings(f.drawings || []); setCurrentPageId(f.id); broadcast(f.nodes || [], f.edges || [], f.drawings || [], rem);
            }} />
            <ShareBoardModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} boardId={whiteboardId} />
        </div>
    );
}
