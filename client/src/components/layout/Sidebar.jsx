import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useAuth } from '@/context/AuthContext'
import MyTasksSidebar from '@/components/task/MyTasksSidebar'
import ProjectSidebar from '@/components/project/overview/ProjectsSidebar'
import WorkspaceDropdown from '@/components/workspace/WorkspaceDropdown'
import { FolderOpenIcon, LayoutDashboardIcon, SettingsIcon, UsersIcon, MessageSquare, Calendar, FolderKanban, Inbox as InboxIcon, ShieldCheck, History, Crown, Presentation } from 'lucide-react'

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
                console.log("[DEBUG SIDEBAR] Checked unread list:", unread, "hasUnread:", unread.length > 0);
                setHasUnread(unread.length > 0);
            } catch (err) {
                console.error("[DEBUG SIDEBAR] Failed to parse unread list", err);
                setHasUnread(false);
            }
        };

        checkUnread();
        window.addEventListener('chat:unread_change', checkUnread);
        return () => window.removeEventListener('chat:unread_change', checkUnread);
    }, []);

    const menuItems = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboardIcon },
        { name: 'Inbox', href: '/inbox', icon: InboxIcon },
        { name: 'Projects', href: '/projects', icon: FolderOpenIcon },
        { name: 'Portfolios', href: '/portfolios', icon: FolderKanban },
        { name: 'Whiteboard', href: '/whiteboards', icon: Presentation },
        ...(canAccessRolePortal ? [{ name: 'Role Portal', href: '/roles', icon: ShieldCheck }] : []),
        ...(canAccessAuditLogs ? [{ name: 'Audit Logs', href: '/audit-logs', icon: History }] : []),
        ...(isOwner ? [{ name: 'Owner Command', href: '/owner-audit', icon: Crown }] : []),
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
        <div ref={sidebarRef} className={`z-10 bg-white dark:bg-zinc-900 min-w-68 flex flex-col h-screen border-r border-gray-200 dark:border-zinc-800 max-sm:absolute transition-all ${isSidebarOpen ? 'left-0' : '-left-full'} `} >
            <div className="py-4.5 px-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-center">
                <NavLink to="/dashboard" className="flex items-center justify-center">
                    <img src="/Logos/Syncro(Dark).png" alt="Syncro Logo" className="h-9 w-auto hidden dark:block object-contain" />
                    <img src="/Logos/Syncro(Light).png" alt="Syncro Logo" className="h-9 w-auto block dark:hidden object-contain" />
                </NavLink>
            </div>

            <WorkspaceDropdown onCreateWorkspace={onCreateWorkspace} />
            <hr className='border-gray-200 dark:border-zinc-800' />
            <div className='flex-1 overflow-y-scroll no-scrollbar flex flex-col'>
                <div>
                    <div className='p-4'>
                        {menuItems.map((item) => (
                            <NavLink to={item.href} key={item.name} className={({ isActive }) => `flex items-center gap-3 py-2 px-4 text-gray-800 dark:text-zinc-100 cursor-pointer rounded transition-all  ${isActive ? 'bg-gray-100 dark:bg-zinc-900 dark:bg-gradient-to-br dark:from-zinc-800 dark:to-zinc-800/50  dark:ring-zinc-800' : 'hover:bg-gray-50 dark:hover:bg-zinc-800/60'}`} >
                                <div className="relative flex items-center gap-3 w-full">
                                    <item.icon size={16} />
                                    <p className='text-sm truncate'>{item.name}</p>
                                    {item.name === 'Chat' && hasUnread && (
                                        <span className="absolute right-0 size-2 bg-red-500 rounded-full animate-pulse" />
                                    )}
                                </div>
                            </NavLink>
                        ))}
                    </div>

                    <MyTasksSidebar />
                    <ProjectSidebar />
                </div>
            </div>

            <div className="p-3 border-t border-gray-100 dark:border-zinc-800 text-[10px] text-gray-400 dark:text-zinc-500 flex items-center justify-around shrink-0">
                <NavLink to="/privacy" className="hover:text-blue-500 transition">Privacy Policy</NavLink>
                <span>•</span>
                <NavLink to="/terms" className="hover:text-blue-500 transition">Terms of Service</NavLink>
            </div>
        </div>
    )
}

export default Sidebar
