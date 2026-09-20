import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useAuth } from '@/context/AuthContext'
import MyTasksSidebar from '@/components/task/MyTasksSidebar'
import ProjectSidebar from '@/components/project/overview/ProjectsSidebar'
import WorkspaceDropdown from '@/components/workspace/WorkspaceDropdown'
import { Badge } from '@/components/ui/badge'
import { 
    FolderOpenIcon, 
    LayoutDashboardIcon, 
    SettingsIcon, 
    UsersIcon, 
    MessageSquare, 
    Calendar, 
    FolderKanban, 
    Inbox as InboxIcon, 
    ShieldCheck, 
    History, 
    Crown, 
    Presentation 
} from 'lucide-react'

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen, onCreateWorkspace }) => {
    const { user } = useAuth();
    const currentWorkspace = useSelector((state) => state?.workspace?.currentWorkspace);

    const isOwner = currentWorkspace?.ownerId === user?.id;
    const settings = typeof currentWorkspace?.settings === 'object' && currentWorkspace?.settings ? currentWorkspace.settings : {};
    const allowManagerPortalAccess = settings.allowManagerPortalAccess ?? false;

    const userMember = currentWorkspace?.members?.find((m) => m.userId === user?.id);
    const userRole = userMember?.customRole || userMember?.role || (isOwner ? 'OWNER' : 'MEMBER');

    const canAccessRolePortal = isOwner || (userRole === 'MANAGER' && allowManagerPortalAccess) || (userRole === 'ADMIN');
    const canAccessAuditLogs = isOwner || userRole === 'ADMIN' || userRole === 'MANAGER';

    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        const checkUnread = () => {
            try {
                const unread = JSON.parse(localStorage.getItem('unread_chats') || "[]");
                setHasUnread(unread.length > 0);
            } catch {
                setHasUnread(false);
            }
        };

        checkUnread();
        window.addEventListener('chat:unread_change', checkUnread);
        return () => window.removeEventListener('chat:unread_change', checkUnread);
    }, []);

    const menuItems = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboardIcon },
        { name: 'Inbox', href: '/inbox', icon: InboxIcon },
        { name: 'Projects', href: '/projects', icon: FolderOpenIcon },
        { name: 'Portfolios', href: '/portfolios', icon: FolderKanban },
        { name: 'Whiteboard', href: '/whiteboards', icon: Presentation },
        ...(canAccessRolePortal ? [{ name: 'Role Portal', href: '/roles', icon: ShieldCheck }] : []),
        ...(canAccessAuditLogs ? [{ name: 'Audit Logs', href: '/audit-logs', icon: History }] : []),
        ...(isOwner ? [{ name: 'Owner Command', href: '/owner-audit', icon: Crown }] : []),
        ...(user?.isSuperAdmin ? [{ name: 'Gatekeeper Admin', href: '/admin/gatekeeper', icon: ShieldCheck }] : []),
        { name: 'Calendar', href: '/calendar', icon: Calendar },
        { name: 'Team', href: '/team', icon: UsersIcon },
        { name: 'Chat', href: '/chat', icon: MessageSquare },
        { name: 'Settings', href: '/settings', icon: SettingsIcon },
    ];

    const sidebarRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                setIsSidebarOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [setIsSidebarOpen]);

    return (
        <aside 
            ref={sidebarRef} 
            className={`z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md w-64 flex flex-col h-screen border-r border-slate-200/80 dark:border-zinc-800/80 max-sm:fixed max-sm:inset-y-0 transition-all duration-300 ease-in-out shadow-xs ${
                isSidebarOpen ? 'left-0' : '-left-full sm:left-0'
            }`} 
        >
            {/* Header Brand */}
            <div className="py-4 px-5 border-b border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
                <NavLink to="/dashboard" className="flex items-center gap-2">
                    <img src="/Logos/Syncro(Dark).png" alt="Syncro Logo" className="h-8 w-auto hidden dark:block object-contain" />
                    <img src="/Logos/Syncro(Light).png" alt="Syncro Logo" className="h-8 w-auto block dark:hidden object-contain" />
                </NavLink>
                <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0 border-blue-200 text-blue-600 dark:border-blue-900/60 dark:text-blue-400">
                    PRO
                </Badge>
            </div>

            {/* Workspace Selector */}
            <WorkspaceDropdown onCreateWorkspace={onCreateWorkspace} />

            <div className="h-px bg-slate-100 dark:bg-zinc-800/60 mx-4" />

            {/* Main Navigation Scroll Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col px-3 py-3 space-y-4">
                <nav className="space-y-1">
                    <p className="px-3 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                        Menu
                    </p>
                    {menuItems.map((item) => (
                        <NavLink 
                            to={item.href} 
                            key={item.name} 
                            className={({ isActive }) => 
                                `group relative flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-150 ${
                                    isActive 
                                        ? 'bg-blue-50 text-blue-700 dark:bg-zinc-800 dark:text-zinc-100 font-semibold shadow-2xs' 
                                        : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100/70 dark:hover:bg-zinc-800/50 hover:text-slate-900 dark:hover:text-zinc-200'
                                }`
                            } 
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 dark:bg-blue-500 rounded-r-full" />
                                    )}
                                    <item.icon className={`h-4 w-4 shrink-0 transition-colors ${
                                        isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300'
                                    }`} />
                                    <span className="truncate flex-1">{item.name}</span>
                                    {item.name === 'Chat' && hasUnread && (
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                                        </span>
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="h-px bg-slate-100 dark:bg-zinc-800/60 mx-1" />

                <MyTasksSidebar />
                <ProjectSidebar />
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 dark:border-zinc-800/60 text-[11px] text-slate-400 dark:text-zinc-500 flex items-center justify-around shrink-0 bg-slate-50/50 dark:bg-zinc-900/50">
                <NavLink to="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition">Privacy</NavLink>
                <span>•</span>
                <NavLink to="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition">Terms</NavLink>
            </div>
        </aside>
    )
}

export default Sidebar
