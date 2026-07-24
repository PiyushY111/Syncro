import { useState, useEffect } from 'react';
import { Plus, Trash2, CheckSquare, Square } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Scratchpad() {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [input, setInput] = useState("");

    const storageKey = `scratchpad_${user?.id || 'guest'}`;

    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                setItems(JSON.parse(saved));
            } catch (err) {
                console.error("Failed to parse scratchpad items:", err);
            }
        }
    }, [storageKey]);

    const saveItems = (newItems) => {
        setItems(newItems);
        localStorage.setItem(storageKey, JSON.stringify(newItems));
    };

    const handleAdd = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        const newItem = { id: Date.now(), text: input.trim(), done: false };
        saveItems([...items, newItem]);
        setInput("");
    };

    const handleToggle = (id) => {
        const updated = items.map(item => 
            item.id === id ? { ...item, done: !item.done } : item
        );
        saveItems(updated);
    };

    const handleDelete = (id) => {
        const filtered = items.filter(item => item.id !== id);
        saveItems(filtered);
    };

    return (
        <div className="bg-white dark:bg-zinc-955 dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 text-left shadow-xs transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-350 mb-4 uppercase tracking-wider">
                🗒️ Personal Scratchpad
            </h3>
            
            <form onSubmit={handleAdd} className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Add quick reminder..."
                    className="w-full text-xs rounded-xl border border-zinc-250 dark:border-zinc-800 px-3.5 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-200 placeholder-zinc-450 transition duration-200"
                />
                <button type="submit" className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-stiff hover:scale-[1.03] shrink-0">
                    <Plus className="size-4" />
                </button>
            </form>

            {items.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-6">No tasks in your scratchpad</p>
            ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-2.5 p-3 rounded-xl bg-zinc-50/40 dark:bg-zinc-900/10 border border-zinc-100/50 dark:border-zinc-850 hover:border-zinc-200 dark:hover:border-zinc-800 transition-all duration-300 animate-stiff-pop">
                            <button onClick={() => handleToggle(item.id)} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 transition shrink-0 cursor-pointer">
                                {item.done ? (
                                    <CheckSquare className="size-4 text-emerald-500" />
                                ) : (
                                    <Square className="size-4" />
                                )}
                            </button>
                            <span className={`text-xs flex-1 break-all select-none font-medium leading-relaxed ${item.done ? 'line-through text-zinc-400 dark:text-zinc-600' : 'text-zinc-855 dark:text-zinc-250'}`}>
                                {item.text}
                            </span>
                            <button onClick={() => handleDelete(item.id)} className="text-zinc-400 hover:text-rose-500 transition shrink-0 p-1 cursor-pointer">
                                <Trash2 className="size-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
