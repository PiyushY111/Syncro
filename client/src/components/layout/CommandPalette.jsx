/**
 * ⌘K command palette: fuzzy-ish search over projects, tasks and pages with keyboard navigation.
 */
import { Fragment, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Search, FolderClosed, CircleDot, CornerDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTasksWithProject } from '@/components/dashboard/dashboardMetrics';
import { buildNavGroups, getNavAccess } from '@/components/layout/sidebarNav';
import { useAuth } from '@/context/AuthContext';

const MAX_PER_GROUP = 5;

const includes = (value, query) => (value || '').toLowerCase().includes(query);

function useResults(query) {
    const { user } = useAuth();
    const workspace = useSelector((state) => state?.workspace?.currentWorkspace || null);

    return useMemo(() => {
        const q = query.trim().toLowerCase();
        const pages = buildNavGroups(getNavAccess(workspace, user))
            .flatMap((g) => g.items)
            .filter((p) => !q || includes(p.name, q))
            .map((p) => ({ id: `page-${p.href}`, group: 'Jump to', label: p.name, icon: p.icon, path: p.href }));

        const projects = (workspace?.projects || [])
            .filter((p) => !q || includes(p.name, q) || includes(p.description, q))
            .slice(0, MAX_PER_GROUP)
            .map((p) => ({ id: `project-${p.id}`, group: 'Projects', label: p.name, icon: FolderClosed, path: `/projectsDetail?id=${p.id}&tab=tasks` }));

        const tasks = q
            ? getTasksWithProject(workspace)
                .filter((t) => includes(t.title, q) || includes(t.description, q))
                .slice(0, MAX_PER_GROUP)
                .map((t) => ({ id: `task-${t.id}`, group: 'Tasks', label: t.title, hint: t.projectName, icon: CircleDot, path: `/taskDetails?projectId=${t.projectId}&taskId=${t.id}` }))
            : [];

        return q ? [...projects, ...tasks, ...pages] : [...pages, ...projects];
    }, [query, workspace, user]);
}

function ResultRow({ item, isActive, onSelect, onHover }) {
    const Icon = item.icon;
    return (
        <li role="option" aria-selected={isActive}>
            <button
                type="button"
                onClick={() => onSelect(item)}
                onMouseMove={onHover}
                className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm',
                    isActive ? 'bg-brand text-white' : 'text-slate-700 dark:text-zinc-300'
                )}
            >
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-lime' : 'text-slate-400 dark:text-zinc-500')} />
                <span className="flex-1 truncate">{item.label}</span>
                {item.hint && <span className={cn('truncate text-xs', isActive ? 'text-white/70' : 'text-slate-400 dark:text-zinc-500')}>{item.hint}</span>}
                {isActive && <CornerDownLeft className="h-3.5 w-3.5 text-white/70" />}
            </button>
        </li>
    );
}

export default function CommandPalette({ open, onOpenChange }) {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const results = useResults(query);

    const handleOpenChange = (next) => {
        if (!next) { setQuery(''); setActiveIndex(0); }
        onOpenChange(next);
    };

    const handleSelect = (item) => {
        navigate(item.path);
        handleOpenChange(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, results.length - 1)); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
        if (e.key === 'Enter' && results[activeIndex]) { e.preventDefault(); handleSelect(results[activeIndex]); }
    };

    return (
        <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px]" />
                <DialogPrimitive.Content
                    onKeyDown={handleKeyDown}
                    className="sx-rise fixed left-1/2 top-[14vh] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_24px_64px_-16px_rgba(12,14,20,0.35)] dark:border-white/[0.08] dark:bg-zinc-900"
                >
                    <DialogPrimitive.Title className="sr-only">Search Syncro</DialogPrimitive.Title>
                    <DialogPrimitive.Description className="sr-only">Search projects, tasks and pages. Use arrow keys to move and Enter to open.</DialogPrimitive.Description>
                    <div className="flex items-center gap-3 border-b border-black/[0.06] px-4 dark:border-white/[0.06]">
                        <Search className="h-4 w-4 text-slate-400" />
                        <input
                            autoFocus
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
                            placeholder="Search projects, tasks, pages…"
                            aria-label="Search"
                            className="h-14 flex-1 bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400 dark:text-zinc-100"
                        />
                        <kbd className="font-data rounded border border-black/[0.08] px-1.5 py-0.5 text-[10px] text-slate-400 dark:border-white/[0.1]">ESC</kbd>
                    </div>

                    <div className="max-h-[52vh] overflow-y-auto p-2">
                        {results.length === 0 ? (
                            <p className="px-3 py-10 text-center text-sm text-slate-500 dark:text-zinc-400">No matches for “{query}”</p>
                        ) : (
                            <ul role="listbox" aria-label="Results">
                                {results.map((item, index) => {
                                    const startsGroup = index === 0 || results[index - 1].group !== item.group;
                                    return (
                                        <Fragment key={item.id}>
                                            {startsGroup && (
                                                <li role="presentation" className="font-data px-3 pb-1 pt-3 text-xs font-medium text-slate-400 dark:text-zinc-500">{item.group}</li>
                                            )}
                                            <ResultRow item={item} isActive={index === activeIndex} onSelect={handleSelect} onHover={() => setActiveIndex(index)} />
                                        </Fragment>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
