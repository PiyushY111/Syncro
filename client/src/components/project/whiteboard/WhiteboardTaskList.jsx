import { X, Search } from 'lucide-react';
import { useState } from 'react';

export default function WhiteboardTaskList({ tasks, onClose, onAddTaskNode }) {
    const [search, setSearch] = useState('');

    const filtered = tasks.filter(t => 
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.status.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="absolute top-0 right-0 h-full w-80 bg-white/60 dark:bg-white/[0.03] border-l border-slate-900/[0.07] dark:border-white/[0.07] shadow-2xl z-30 flex flex-col transition-all">
            <div className="p-4 border-b border-slate-900/[0.07] dark:border-white/[0.07] flex items-center justify-between">
                <h3 className="font-bold text-zinc-900 dark:text-white">Project Tasks</h3>
                <button onClick={onClose} className="p-1 hover:bg-slate-500/10 dark:hover:bg-white/[0.07] rounded cursor-pointer">
                    <X className="size-5" />
                </button>
            </div>
            
            <div className="p-3 border-b border-slate-900/[0.07] dark:border-white/[0.07]">
                <div className="relative flex items-center">
                    <Search className="size-4 text-zinc-400 absolute left-3 pointer-events-none" />
                    <input type="text" placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-slate-500/[0.05] dark:bg-zinc-850 text-sm pl-9 pr-3 py-2 rounded-lg border border-slate-900/[0.07] dark:border-white/[0.07] focus:outline-none focus:ring-1 focus:ring-brand/25" />
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {filtered.length === 0 ? (
                    <div className="text-center text-xs text-zinc-450 dark:text-zinc-500 mt-10">No tasks found</div>
                ) : (
                    filtered.map((t) => (
                        <div key={t.id} onClick={() => onAddTaskNode(t)} className="p-3 rounded-lg border border-slate-900/[0.07] dark:border-white/[0.07] bg-slate-500/[0.05] hover:bg-slate-500/[0.06] dark:bg-zinc-850/40 dark:hover:bg-white/[0.07] transition-colors cursor-pointer group flex flex-col gap-1.5 text-left">
                            <div className="flex justify-between items-start gap-2">
                                <span className="text-xs font-semibold text-zinc-900 dark:text-white group-hover:text-blue-500 transition-colors line-clamp-2">
                                    {t.title}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                                <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${t.status === 'DONE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-brand/10 text-brand dark:bg-brand/15 dark:text-violet-300'}`}>
                                    {t.status}
                                </span>
                                <span className="text-zinc-450 dark:text-zinc-500 font-mono">
                                    Priority: {t.priority}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
