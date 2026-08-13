import { useState, useEffect } from 'react';
import { Plus, Trash2, CheckSquare, Square, StickyNote } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

    const completedCount = items.filter(i => i.done).length;

    return (
        <Card className="border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 shadow-sm">
            <CardHeader className="p-4 border-b border-slate-100 dark:border-zinc-800/60 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                        <StickyNote className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                        Personal Scratchpad
                    </CardTitle>
                </div>
                {items.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] font-semibold py-0.5 px-2">
                        {completedCount}/{items.length} Done
                    </Badge>
                )}
            </CardHeader>

            <CardContent className="p-4">
                <form onSubmit={handleAdd} className="flex gap-2 mb-3">
                    <Input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Add a quick note or reminder..."
                        className="h-9 text-xs bg-slate-50/60 dark:bg-zinc-800/50 border-slate-200/80 dark:border-zinc-800"
                    />
                    <Button 
                        type="submit" 
                        size="icon" 
                        className="h-9 w-9 bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </form>

                {items.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-zinc-500 text-center py-6">
                        Scratchpad is empty. Add notes to keep track of quick tasks!
                    </p>
                ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                        {items.map((item) => (
                            <div 
                                key={item.id} 
                                className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50/60 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800/60 hover:bg-slate-100/70 dark:hover:bg-zinc-800/70 transition-colors"
                            >
                                <button 
                                    onClick={() => handleToggle(item.id)} 
                                    className="text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 shrink-0 cursor-pointer"
                                >
                                    {item.done ? (
                                        <CheckSquare className="h-4 w-4 text-emerald-500" />
                                    ) : (
                                        <Square className="h-4 w-4" />
                                    )}
                                </button>
                                <span className={`text-xs flex-1 break-all select-none font-medium ${item.done ? 'line-through text-slate-400 dark:text-zinc-500' : 'text-slate-700 dark:text-zinc-200'}`}>
                                    {item.text}
                                </span>
                                <button 
                                    onClick={() => handleDelete(item.id)} 
                                    className="text-slate-400 hover:text-rose-500 dark:text-zinc-500 dark:hover:text-rose-400 shrink-0 p-1 cursor-pointer transition-colors"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
