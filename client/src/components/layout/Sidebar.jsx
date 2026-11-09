/**
 * App sidebar.
 * Desktop: a slim icon rail that expands over the page on hover (or keyboard focus) and can be locked open.
 * Mobile: a full-width-label drawer toggled from the navbar.
 * Icons sit in a fixed 48px column so nothing shifts while the rail expands; labels simply fade in.
 */
import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Lock, LockOpen } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import WorkspaceDropdown from '@/components/workspace/WorkspaceDropdown';
import SidebarProjects from '@/components/layout/SidebarProjects';
import UserMenu from '@/components/layout/UserMenu';
import { buildNavGroups, getNavAccess } from '@/components/layout/sidebarNav';
import { useSidebarRail, railText } from '@/components/layout/useSidebarRail';

const readHasUnread = () => {
    try {
        return JSON.parse(localStorage.getItem('unread_chats') || '[]').length > 0;
    } catch {
        return false;
    }
};

function useUnreadChats() {
    const [hasUnread, setHasUnread] = useState(readHasUnread);
    useEffect(() => {
        const sync = () => setHasUnread(readHasUnread());
        window.addEventListener('chat:unread_change', sync);
        return () => window.removeEventListener('chat:unread_change', sync);
    }, []);
    return hasUnread;
}

function NavItem({ item, hasUnread, isExpanded, onNavigate }) {
    const Icon = item.icon;
    const showDot = item.showsUnread && hasUnread;
    return (
        <NavLink
            to={item.href}
            onClick={onNavigate}
            title={isExpanded ? undefined : item.name}
            className={({ isActive }) => cn(
                'group/item relative flex h-10 items-center gap-3 rounded-xl px-[15px] text-[13px] font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-rail-accent/50',
                isActive
                    ? 'bg-rail-active text-rail-fg shadow-[0_4px_14px_-8px_rgba(30,27,75,0.35)] dark:shadow-none'
                    : 'text-rail-muted hover:bg-rail-hover hover:text-rail-fg'
            )}
        >
            {({ isActive }) => (
                <>
                    {isActive && <span aria-hidden className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand dark:bg-lime" />}
                    <span className="relative shrink-0">
                        <Icon className={cn('h-[18px] w-[18px]', isActive ? 'text-brand dark:text-lime' : 'text-rail-subtle group-hover/item:text-rail-fg')} strokeWidth={1.8} />
                        {showDot && <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#10121a]" aria-label="Unread messages" />}
                    </span>
                    <span className={cn('flex-1 truncate', railText(isExpanded))}>{item.name}</span>
                </>
            )}
        </NavLink>
    );
}

/** Group heading when expanded; a short hairline when collapsed so groups stay visually separated. */
function GroupLabel({ label, isExpanded }) {
    return (
        <div className="relative mb-1 flex h-6 items-center px-[15px]">
            <span aria-hidden className={cn('absolute left-[15px] h-px w-[18px] bg-rail-line transition-opacity duration-200 max-sm:opacity-0', isExpanded ? 'opacity-0' : 'opacity-100')} />
            <p className={cn('font-data text-[11px] font-medium uppercase tracking-[0.08em] text-rail-subtle', railText(isExpanded))}>{label}</p>
        </div>
    );
}

function LockButton({ isLocked, isExpanded, onToggle }) {
    const Icon = isLocked ? Lock : LockOpen;
    return (
        <button
            type="button"
            onClick={onToggle}
            aria-pressed={isLocked}
            aria-label={isLocked ? 'Unlock sidebar (expand on hover)' : 'Lock sidebar open'}
            title={isLocked ? 'Unlock — expand on hover' : 'Lock open'}
            tabIndex={isExpanded ? 0 : -1}
            className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 max-sm:hidden',
                'outline-none focus-visible:ring-2 focus-visible:ring-rail-accent/50',
                isLocked ? 'bg-brand/10 text-brand dark:bg-lime/10 dark:text-lime' : 'text-rail-subtle hover:bg-rail-hover hover:text-rail-fg',
                isExpanded ? 'opacity-100' : 'pointer-events-none opacity-0'
            )}
        >
            <Icon className="h-4 w-4" />
        </button>
    );
}

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen, onCreateWorkspace }) {
    const { user } = useAuth();
    const currentWorkspace = useSelector((state) => state?.workspace?.currentWorkspace);
    const hasUnread = useUnreadChats();
    const sidebarRef = useRef(null);
    const { isLocked, isExpanded, toggleLock, onMenuOpenChange, railHandlers } = useSidebarRail();

    const navGroups = buildNavGroups(getNavAccess(currentWorkspace, user));
    const closeOnMobile = () => setIsSidebarOpen(false);
    const isFloating = isExpanded && !isLocked;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) setIsSidebarOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [setIsSidebarOpen]);

    return (
        <>
            {/* Reserves the rail's space on desktop; widens only when locked, so hover never reflows the page. */}
            <div aria-hidden className={cn('hidden shrink-0 transition-[width] duration-300 ease-out sm:block', isLocked ? 'w-[276px]' : 'w-[84px]')} />

            {isSidebarOpen && <div aria-hidden className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-[2px] sm:hidden" />}

            <aside
                ref={sidebarRef}
                aria-label="Main navigation"
                data-expanded={isExpanded}
                {...railHandlers}
                className={cn(
                    'sx-glass fixed z-40 flex flex-col overflow-hidden text-rail-fg',
                    'transition-[width,transform,box-shadow,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                    // Desktop rail
                    'sm:bottom-3 sm:left-3 sm:top-3 sm:rounded-3xl',
                    isExpanded ? 'sm:w-[264px]' : 'sm:w-[72px]',
                    isFloating && 'bg-white/90 shadow-[0_30px_70px_-24px_rgba(30,27,75,0.45)] dark:bg-[#11131c]/92 dark:shadow-[0_30px_70px_-24px_rgba(0,0,0,0.9)]',
                    // Mobile drawer
                    'max-sm:inset-y-0 max-sm:left-0 max-sm:w-[280px] max-sm:rounded-none max-sm:bg-white/95 max-sm:shadow-2xl dark:max-sm:bg-zinc-950/95',
                    isSidebarOpen ? 'max-sm:translate-x-0' : 'max-sm:-translate-x-full'
                )}
            >
                <div className="flex h-16 shrink-0 items-center justify-between gap-2 pl-[22px] pr-3">
                    <NavLink to="/dashboard" className="relative flex h-8 shrink-0 items-center" aria-label="Syncro home">
                        <span className={cn('absolute left-0 transition-opacity duration-200 max-sm:opacity-0', isExpanded ? 'opacity-0' : 'opacity-100')}>
                            <img src="/Logos/Syncro-S(light).png" alt="" className="h-7 w-7 max-w-none object-contain mix-blend-multiply dark:hidden" />
                            <img src="/Logos/Syncro-S(Dark).png" alt="" className="hidden h-7 w-7 max-w-none object-contain dark:block dark:mix-blend-screen" />
                        </span>
                        <span className={railText(isExpanded)}>
                            <img src="/Logos/Syncro(Light).png" alt="Syncro" className="h-7 w-auto object-contain mix-blend-multiply dark:hidden" />
                            <img src="/Logos/Syncro(Dark).png" alt="Syncro" className="hidden h-7 w-auto object-contain dark:block dark:mix-blend-screen" />
                        </span>
                    </NavLink>
                    <LockButton isLocked={isLocked} isExpanded={isExpanded} onToggle={toggleLock} />
                </div>

                <div className="shrink-0 px-3 pb-2">
                    <WorkspaceDropdown onCreateWorkspace={onCreateWorkspace} isExpanded={isExpanded} onOpenChange={onMenuOpenChange} />
                </div>

                <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-3 py-2">
                    {navGroups.map((group) => (
                        <nav key={group.label} aria-label={group.label} className="space-y-0.5">
                            <GroupLabel label={group.label} isExpanded={isExpanded} />
                            {group.items.map((item) => (
                                <NavItem key={item.href} item={item} hasUnread={hasUnread} isExpanded={isExpanded} onNavigate={closeOnMobile} />
                            ))}
                        </nav>
                    ))}
                    <SidebarProjects onNavigate={closeOnMobile} isExpanded={isExpanded} />
                </div>

                <div className="shrink-0 border-t border-rail-line p-3">
                    <UserMenu isExpanded={isExpanded} onOpenChange={onMenuOpenChange} />
                </div>
            </aside>
        </>
    );
}
