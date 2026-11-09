/**
 * Sidebar navigation model. Pure so the permission rules are easy to read and test.
 */
import {
    LayoutGrid,
    Inbox,
    FolderClosed,
    Layers,
    PenTool,
    CalendarDays,
    Users,
    MessagesSquare,
    Settings,
    ShieldCheck,
    ScrollText,
    Crown,
    Shield,
} from 'lucide-react';

/** Resolves what the current user is allowed to see in the sidebar. */
export const getNavAccess = (workspace, user) => {
    const isOwner = Boolean(workspace?.ownerId) && workspace.ownerId === user?.id;
    const settings = workspace?.settings && typeof workspace.settings === 'object' ? workspace.settings : {};
    const member = workspace?.members?.find((m) => m.userId === user?.id);
    const role = member?.customRole || member?.role || (isOwner ? 'OWNER' : 'MEMBER');

    return {
        isOwner,
        isSuperAdmin: Boolean(user?.isSuperAdmin),
        canAccessRolePortal: isOwner || role === 'ADMIN' || (role === 'MANAGER' && Boolean(settings.allowManagerPortalAccess)),
        canAccessAuditLogs: isOwner || role === 'ADMIN' || role === 'MANAGER',
    };
};

/** Grouped nav items; empty groups are dropped. */
export const buildNavGroups = (access) => [
    {
        label: 'Work',
        items: [
            { name: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
            { name: 'Inbox', href: '/inbox', icon: Inbox },
            { name: 'Projects', href: '/projects', icon: FolderClosed },
            { name: 'Portfolios', href: '/portfolios', icon: Layers },
            { name: 'Calendar', href: '/calendar', icon: CalendarDays },
            { name: 'Whiteboard', href: '/whiteboards', icon: PenTool },
        ],
    },
    {
        label: 'Team',
        items: [
            { name: 'Members', href: '/team', icon: Users },
            { name: 'Chat', href: '/chat', icon: MessagesSquare, showsUnread: true },
            { name: 'Settings', href: '/settings', icon: Settings },
        ],
    },
    {
        label: 'Governance',
        items: [
            access.canAccessRolePortal && { name: 'Role Portal', href: '/roles', icon: ShieldCheck },
            access.canAccessAuditLogs && { name: 'Audit Logs', href: '/audit-logs', icon: ScrollText },
            access.isOwner && { name: 'Owner Command', href: '/owner-audit', icon: Crown },
            access.isSuperAdmin && { name: 'Gatekeeper', href: '/admin/gatekeeper', icon: Shield },
        ].filter(Boolean),
    },
].filter((group) => group.items.length > 0);

/** Human page titles for the top-bar breadcrumb. */
export const PAGE_TITLES = {
    '/dashboard': 'Dashboard',
    '/inbox': 'Inbox',
    '/projects': 'Projects',
    '/projectsDetail': 'Project',
    '/portfolios': 'Portfolios',
    '/portfoliosDetail': 'Portfolio',
    '/roles': 'Role Portal',
    '/audit-logs': 'Audit Logs',
    '/owner-audit': 'Owner Command',
    '/admin/gatekeeper': 'Gatekeeper',
    '/taskDetails': 'Task',
    '/calendar': 'Calendar',
    '/whiteboards': 'Whiteboard',
    '/team': 'Members',
    '/chat': 'Chat',
    '/settings': 'Settings',
};
