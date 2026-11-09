/**
 * Notes: quick private checklist stored in this browser.
 */
import { useState } from 'react';
import { ArrowUp, X, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import Panel from '@/components/dashboard/Panel';

const MAX_NOTE_LENGTH = 280;

const readItems = (key) => {
    try {
        const parsed = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

function NoteRow({ item, onToggle, onDelete }) {
    return (
        <li className="group flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]">
            <button
                type="button"
                onClick={onToggle}
                aria-label={item.done ? 'Mark as not done' : 'Mark as done'}
                className={cn(
                    'mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border-[1.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
                    item.done ? 'border-brand bg-brand text-white' : 'border-slate-300 hover:border-brand dark:border-zinc-600'
                )}
            >
                {item.done && <Check className="h-3 w-3" strokeWidth={3} />}
            </button>
            <span className={cn('flex-1 break-words text-sm leading-6', item.done ? 'text-slate-400 line-through dark:text-zinc-500' : 'text-slate-700 dark:text-zinc-200')}>
                {item.text}
            </span>
            <button
                type="button"
                onClick={onDelete}
                aria-label="Delete note"
                className="mt-0.5 shrink-0 rounded p-0.5 text-slate-300 opacity-0 transition hover:text-rose-500 focus-visible:opacity-100 group-hover:opacity-100 dark:text-zinc-600"
            >
                <X className="h-4 w-4" />
            </button>
        </li>
    );
}

function Notes({ storageKey, className, delay }) {
    const [items, setItems] = useState(() => readItems(storageKey));
    const [input, setInput] = useState('');

    const saveItems = (next) => {
        setItems(next);
        try {
            localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
            // Storage blocked or full (private mode): notes still work for this session.
        }
    };

    const handleAdd = (e) => {
        e.preventDefault();
        const text = input.trim();
        if (!text) return;
        saveItems([{ id: Date.now(), text, done: false }, ...items]);
        setInput('');
    };

    const doneCount = items.filter((i) => i.done).length;

    return (
        <Panel
            eyebrow={items.length ? `${doneCount} of ${items.length} done` : 'Only you can see these'}
            title="Notes"
            className={className}
            delay={delay}
            bodyClassName="px-3"
        >
            <form onSubmit={handleAdd} className="relative mx-2 mb-2">
                <label htmlFor="dashboard-note" className="sr-only">Add a note</label>
                <input
                    id="dashboard-note"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    maxLength={MAX_NOTE_LENGTH}
                    placeholder="Jot something down…"
                    className="h-10 w-full rounded-xl border border-white/70 bg-white/60 pl-3.5 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-100 dark:focus:bg-zinc-900"
                />
                <button
                    type="submit"
                    aria-label="Add note"
                    disabled={!input.trim()}
                    className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg bg-ink text-white transition-opacity disabled:opacity-25 dark:bg-white dark:text-ink"
                >
                    <ArrowUp className="h-4 w-4" />
                </button>
            </form>

            {items.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-slate-400 dark:text-zinc-500">Your notes are saved in this browser.</p>
            ) : (
                <ul className="max-h-64 overflow-y-auto">
                    {items.map((item) => (
                        <NoteRow
                            key={item.id}
                            item={item}
                            onToggle={() => saveItems(items.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)))}
                            onDelete={() => saveItems(items.filter((i) => i.id !== item.id))}
                        />
                    ))}
                </ul>
            )}
        </Panel>
    );
}

export default function Scratchpad({ className, delay }) {
    const { user } = useAuth();
    const storageKey = `scratchpad_${user?.id || 'guest'}`;
    // Keyed so switching accounts loads that account's notes.
    return <Notes key={storageKey} storageKey={storageKey} className={className} delay={delay} />;
}
