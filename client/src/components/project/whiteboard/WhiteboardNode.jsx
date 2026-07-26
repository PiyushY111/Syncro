import { useState, useRef, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

const COLOR_MAP = {
    yellow: 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800',
    blue: 'bg-sky-100 dark:bg-sky-900/30 text-sky-900 dark:text-sky-200 border-sky-300 dark:border-sky-800',
    green: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800',
    pink: 'bg-rose-100 dark:bg-rose-900/30 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-800',
    purple: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-200 border-indigo-300 dark:border-indigo-800',
    white: 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700'
};

export default function WhiteboardNode({ node, selected, zoom = 1, onClick, onDrag, onUpdateText, onResize }) {
    const [editing, setEditing] = useState(false);
    const [text, setText] = useState(node.text || '');
    const dragRef = useRef(null);

    useEffect(() => { setText(node.text || ''); }, [node.text]);

    const handleMouseDown = (e) => {
        if (editing) return;
        e.stopPropagation(); onClick(node.id);
        const startX = e.clientX, startY = e.clientY, startNodeX = node.x, startNodeY = node.y;
        const handleMouseMove = (moveEvent) => {
            onDrag(node.id, startNodeX + (moveEvent.clientX - startX) / zoom, startNodeY + (moveEvent.clientY - startY) / zoom);
        };
        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp);
        };
        window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp);
    };

    const handleResizeMouseDown = (e) => {
        e.stopPropagation(); e.preventDefault();
        const startX = e.clientX, startY = e.clientY, startWidth = size.width, startHeight = size.height;
        const handleMouseMove = (moveEvent) => {
            onResize(node.id, Math.max(80, startWidth + (moveEvent.clientX - startX) / zoom), Math.max(50, startHeight + (moveEvent.clientY - startY) / zoom));
        };
        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp);
        };
        window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp);
    };

    const nodeClass = COLOR_MAP[node.color || 'yellow'] || '';
    const size = node.type === 'task' ? { width: 220, height: 120 } : { width: node.width || 150, height: node.height || 100 };

    const renderContent = () => {
        if (node.type === 'task') {
            const task = node.task || {};
            return (
                <div className="flex flex-col justify-between h-full p-3.5 bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg relative select-none text-left">
                    <div className="flex justify-between items-start gap-1">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 line-clamp-2">{task.title || node.text}</span>
                        <a href={`/taskDetails?id=${task.id}`} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-blue-500"><ExternalLink className="size-3" /></a>
                    </div>
                    <div className="flex items-center justify-between text-[9px] pt-2 border-t border-zinc-100 dark:border-zinc-850">
                        <span className={`px-1.5 py-0.5 rounded font-bold ${task.status === 'DONE' ? 'bg-emerald-105 text-emerald-700 dark:bg-emerald-950/20' : 'bg-blue-105 text-blue-700'}`}>{task.status || 'TODO'}</span>
                        <span className="text-zinc-500 font-mono">PRIORITY: {task.priority || 'MEDIUM'}</span>
                    </div>
                </div>
            );
        }

        const isHex = node.color?.startsWith('#');
        const customStyle = isHex ? { backgroundColor: node.color, borderColor: 'rgba(0,0,0,0.15)', color: '#27272a' } : {};

        let shapeStyle = "rounded-lg border-2 flex items-center justify-center p-3 text-center shadow-md select-none cursor-move h-full w-full font-medium text-sm break-words overflow-hidden";
        if (node.type === 'sticky') shapeStyle = "border shadow-lg flex items-center justify-center p-4 text-center select-none cursor-move h-full w-full font-sans font-medium text-sm rotate-1 break-words overflow-hidden";
        if (node.type === 'circle') shapeStyle = "rounded-full border-2 flex items-center justify-center p-3 text-center shadow-md select-none cursor-move h-full w-full font-medium text-sm break-words overflow-hidden";
        if (node.type === 'diamond') shapeStyle = "border-2 flex items-center justify-center p-3 text-center shadow-md select-none cursor-move h-full w-full font-medium text-sm rotate-45 break-words overflow-hidden";

        if (editing) {
            return (
                <div className={`${shapeStyle} ${nodeClass} !p-2`} style={customStyle}>
                    <textarea value={text} onChange={(e) => setText(e.target.value)} onBlur={() => { setEditing(false); onUpdateText(node.id, text); }} autoFocus className="w-full h-full bg-transparent text-center border-0 outline-none resize-none focus:ring-0 text-sm font-medium p-0" />
                </div>
            );
        }

        return (
            <div onDoubleClick={() => setEditing(true)} className={`${shapeStyle} ${nodeClass}`} style={customStyle}>
                <span className={`w-full max-w-full break-words whitespace-pre-wrap ${node.type === 'diamond' ? '-rotate-45 block' : ''}`}>{node.text || 'Double Click to Edit'}</span>
            </div>
        );
    };

    return (
        <div ref={dragRef} onMouseDown={handleMouseDown} style={{ left: `${node.x}px`, top: `${node.y}px`, width: `${size.width}px`, height: `${size.height}px`, position: 'absolute' }} className={`z-10 transition-shadow ${selected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-900 rounded-lg shadow-xl' : ''}`}>
            {renderContent()}
            {selected && node.type !== 'task' && (
                <div onMouseDown={handleResizeMouseDown} className="absolute bottom-0 right-0 w-3 h-3 bg-blue-550 border border-white rounded-full cursor-se-resize z-20" />
            )}
        </div>
    );
}
