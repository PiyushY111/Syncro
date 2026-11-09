/**
 * Slim top bar: breadcrumb, ⌘K command palette trigger, inbox and theme toggle.
 */
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Menu, Search, Inbox, Moon, Sun, ChevronRight } from 'lucide-react';
import { toggleTheme } from '@/features/themeSlice';
import CommandPalette from '@/components/layout/CommandPalette';
import { PAGE_TITLES } from '@/components/layout/sidebarNav';

const iconButton = 'sx-glass flex h-10 w-10 items-center justify-center rounded-2xl text-slate-600 transition-transform hover:-translate-y-px hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 dark:text-zinc-300 dark:hover:text-white';

export default function Navbar({ setIsSidebarOpen }) {
    const dispatch = useDispatch();
    const location = useLocation();
    const theme = useSelector((state) => state.theme?.theme);
    const workspaceName = useSelector((state) => state?.workspace?.currentWorkspace?.name);
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);

    const pageTitle = PAGE_TITLES[location.pathname] || 'Syncro';
    const isDark = theme === 'dark';

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsPaletteOpen((open) => !open);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 bg-transparent px-4 pt-3 sm:px-6 xl:px-10">
            <button
                type="button"
                aria-label="Open navigation"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                className={`${iconButton} sm:hidden`}
            >
                <Menu className="h-5 w-5" />
            </button>

            <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
                {workspaceName && (
                    <>
                        <span className="hidden truncate text-slate-500 sm:inline dark:text-zinc-400">{workspaceName}</span>
                        <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-slate-300 sm:block dark:text-zinc-600" />
                    </>
                )}
                <span className="truncate font-semibold text-slate-900 dark:text-zinc-100">{pageTitle}</span>
            </nav>

            <button
                type="button"
                onClick={() => setIsPaletteOpen(true)}
                className="sx-glass hidden h-10 w-72 items-center gap-2.5 rounded-2xl px-3.5 text-sm text-slate-500 transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 md:flex dark:text-zinc-400"
            >
                <Search className="h-4 w-4" />
                <span className="flex-1 text-left">Search or jump to…</span>
                <kbd className="font-data rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] text-slate-500 shadow-sm dark:bg-white/[0.08] dark:text-zinc-400">⌘K</kbd>
            </button>
            <button type="button" aria-label="Search" onClick={() => setIsPaletteOpen(true)} className={`${iconButton} md:hidden`}>
                <Search className="h-[18px] w-[18px]" />
            </button>

            <Link to="/inbox" aria-label="Inbox" className={iconButton}>
                <Inbox className="h-[18px] w-[18px]" />
            </Link>
            <button
                type="button"
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                onClick={() => dispatch(toggleTheme())}
                className={iconButton}
            >
                {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>

            <CommandPalette open={isPaletteOpen} onOpenChange={setIsPaletteOpen} />
        </header>
    );
}
