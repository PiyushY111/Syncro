import { MousePointer, StickyNote, Square, Circle, Diamond, Pencil, ArrowUpRight, Type, Trash, Plus, Eraser } from 'lucide-react';

const COLORS = [
    { name: 'yellow', hex: 'bg-amber-105 dark:bg-amber-900/40 border-amber-300' },
    { name: 'blue', hex: 'bg-sky-105 dark:bg-sky-900/40 border-sky-300' },
    { name: 'green', hex: 'bg-emerald-105 dark:bg-emerald-900/40 border-emerald-300' },
    { name: 'pink', hex: 'bg-rose-105 dark:bg-rose-900/40 border-rose-300' },
    { name: 'purple', hex: 'bg-indigo-105 dark:bg-indigo-900/40 border-indigo-300' },
    { name: 'white', hex: 'bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700' }
];

export default function WhiteboardToolbar({
    tool,
    setTool,
    color,
    setColor,
    onDelete,
    onAddTaskToggle,
    saving
}) {
    const tools = [
        { id: 'select', icon: MousePointer, label: 'Select' },
        { id: 'text', icon: Type, label: 'Text' },
        { id: 'sticky', icon: StickyNote, label: 'Sticky' },
        { id: 'rect', icon: Square, label: 'Rectangle' },
        { id: 'circle', icon: Circle, label: 'Circle' },
        { id: 'diamond', icon: Diamond, label: 'Diamond' },
        { id: 'draw', icon: Pencil, label: 'Draw' },
        { id: 'eraser', icon: Eraser, label: 'Eraser' },
        { id: 'connection', icon: ArrowUpRight, label: 'Link' }
    ];

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-xl border border-zinc-200/80 dark:border-zinc-800/80 z-20 transition-all select-none">
            <div className="flex items-center gap-1.5 border-b border-zinc-150 dark:border-zinc-800 pb-2">
                {tools.map((t) => {
                    const Icon = t.icon;
                    const active = tool === t.id;
                    return (
                        <button key={t.id} onClick={() => setTool(t.id)} title={t.label} className={`p-2 rounded-lg transition-colors cursor-pointer ${active ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-semibold' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-850'}`}>
                            <Icon className="size-5" />
                        </button>
                    );
                })}
                <div className="h-6 w-px bg-zinc-250 dark:bg-zinc-800 mx-1" />
                <button onClick={onAddTaskToggle} title="Add Task Card" className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-850 cursor-pointer">
                    <Plus className="size-5 text-emerald-600" />
                </button>
                <button onClick={onDelete} title="Delete Selected" className="p-2 rounded-lg text-zinc-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 cursor-pointer">
                    <Trash className="size-5" />
                </button>
            </div>
            
            <div className="flex items-center justify-between w-full pt-1 gap-4">
                <div className="flex items-center gap-1.5">
                    {COLORS.map((c) => (
                        <button key={c.name} onClick={() => setColor(c.name)} className={`size-5 rounded-full border cursor-pointer transition-transform ${c.hex} ${color === c.name ? 'scale-125 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-900' : 'hover:scale-110'}`} />
                    ))}
                    <div className={`relative size-5 rounded-full border border-zinc-300 dark:border-zinc-700 cursor-pointer overflow-hidden transition-transform hover:scale-110 flex items-center justify-center ${color?.startsWith('#') ? 'scale-125 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-900' : ''}`} style={{ background: 'linear-gradient(45deg, red, orange, yellow, green, blue, purple)' }}>
                        <input type="color" value={color?.startsWith('#') ? color : '#3b82f6'} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 size-full opacity-0 cursor-pointer scale-150" />
                        {color?.startsWith('#') && (
                            <div className="absolute inset-0.5 rounded-full border border-white" style={{ backgroundColor: color }} />
                        )}
                    </div>
                </div>
                <div className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase tracking-widest font-mono">
                    {saving ? 'Saving...' : 'Saved'}
                </div>
            </div>
        </div>
    );
}
