/**
 * Account card pinned to the sidebar footer: profile, theme, legal links and sign out.
 */
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronsUpDown, LogOut, Moon, Sun, UserRound, Shield, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toggleTheme } from '@/features/themeSlice';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getInitials } from '@/components/dashboard/dashboardMetrics';
import { railText } from '@/components/layout/useSidebarRail';

export default function UserMenu({ isExpanded = true, onOpenChange }) {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user, logout } = useAuth();
    const theme = useSelector((state) => state.theme?.theme);
    const displayName = user?.name || user?.email?.split('@')[0] || 'Account';
    const isDark = theme === 'dark';

    return (
        <DropdownMenu onOpenChange={onOpenChange}>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    aria-label={`Account: ${displayName}`}
                    className="flex w-full items-center gap-3 rounded-xl p-2 text-left outline-none transition-colors hover:bg-rail-hover focus-visible:ring-2 focus-visible:ring-rail-accent/50"
                >
                    <Avatar className="h-8 w-8 shrink-0 rounded-lg">
                        <AvatarImage src={user?.image} alt="" />
                        <AvatarFallback className="rounded-lg bg-brand text-xs font-semibold text-white">
                            {getInitials(user?.name || user?.email || '')}
                        </AvatarFallback>
                    </Avatar>
                    <span className={`min-w-0 flex-1 ${railText(isExpanded)}`}>
                        <span className="block truncate text-[13px] font-medium text-rail-fg">{displayName}</span>
                        <span className="block truncate text-[11px] text-rail-subtle">{user?.email}</span>
                    </span>
                    <ChevronsUpDown className={`h-4 w-4 shrink-0 text-rail-subtle ${railText(isExpanded)}`} />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="mb-1 w-[236px]">
                <DropdownMenuLabel className="font-normal">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-zinc-100">{displayName}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-zinc-400">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                    <UserRound className="mr-2 h-4 w-4" /> Profile & account
                </DropdownMenuItem>
                {user?.isSuperAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin/gatekeeper')} className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" /> Gatekeeper
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => dispatch(toggleTheme())} className="cursor-pointer">
                    {isDark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                    {isDark ? 'Light mode' : 'Dark mode'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/privacy')} className="cursor-pointer text-slate-500 dark:text-zinc-400">
                    <FileText className="mr-2 h-4 w-4" /> Privacy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/terms')} className="cursor-pointer text-slate-500 dark:text-zinc-400">
                    <FileText className="mr-2 h-4 w-4" /> Terms
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-rose-600 focus:bg-rose-50 dark:text-rose-400 dark:focus:bg-rose-950/40">
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
