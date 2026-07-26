import { X, Search } from 'lucide-react';
import { useState } from 'react';

export default function WhiteboardTaskList({ tasks, onClose, onAddTaskNode }) {
    const [search, setSearch] = useState('');

    const filtered = tasks.filter(t => 
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.status.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="absolute top-0 right-0 h-full w-80 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl z-30 flex flex-col transition-all">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <h3 className="font-bold text-zinc-900 dark:text-white">Project Tasks</h3>
                <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded cursor-pointer">
                    <X className="size-5" />
                </button>
            </div>
            
            <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
                <div className="relative flex items-center">
                    <Search className="size-4 text-zinc-400 absolute left-3 pointer-events-none" />
                    <input type="text" placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-850 text-sm pl-9 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {filtered.length === 0 ? (
                    <div className="text-center text-xs text-zinc-450 dark:text-zinc-500 mt-10">No tasks found</div>
                ) : (
                    filtered.map((t) => (
                        <div key={t.id} onClick={() => onAddTaskNode(t)} className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 hover:bg-zinc-50 dark:bg-zinc-850/40 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer group flex flex-col gap-1.5 text-left">
                            <div className="flex justify-between items-start gap-2">
                                <span className="text-xs font-semibold text-zinc-900 dark:text-white group-hover:text-blue-500 transition-colors line-clamp-2">
                                    {t.title}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                                <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${t.status === 'DONE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'}`}>
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
