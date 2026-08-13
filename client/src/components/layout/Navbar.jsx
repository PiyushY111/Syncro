import { SearchIcon, PanelLeft, LogOut, MoonIcon, SunIcon, User, Settings, Bell } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleTheme } from '@/features/themeSlice'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNavigate } from 'react-router-dom'

const Navbar = ({ setIsSidebarOpen }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { theme } = useSelector(state => state.theme);
    const { user, logout } = useAuth();

    const userInitials = user?.name 
        ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : (user?.email ? user.email.charAt(0).toUpperCase() : 'U');

    return (
        <header className="w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800/80 px-4 sm:px-6 xl:px-12 py-2.5 flex-shrink-0 sticky top-0 z-20">
            <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
                {/* Left section */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Sidebar Trigger & Mobile Brand Logo */}
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setIsSidebarOpen((prev) => !prev)} 
                        className="sm:hidden h-9 w-9 text-slate-700 dark:text-zinc-200" 
                    >
                        <PanelLeft className="h-5 w-5" />
                    </Button>
                    
                    <div className="sm:hidden flex items-center shrink-0">
                        <img src="/Logos/Syncro-S(Dark).png" alt="Syncro Logo" className="h-6 w-auto hidden dark:block" />
                        <img src="/Logos/Syncro-S(light).png" alt="Syncro Logo" className="h-6 w-auto block dark:hidden" />
                    </div>

                    {/* Search Input with Shadcn styling & shortcut indicator */}
                    <div className="relative flex-1 max-w-md hidden sm:block">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 h-4 w-4" />
                        <Input
                            type="text"
                            placeholder="Search projects, tasks, workspace..."
                            className="pl-9 pr-12 h-9 bg-slate-50/60 dark:bg-zinc-800/50 border-slate-200/80 dark:border-zinc-700/60 focus-visible:ring-blue-500/30 rounded-lg text-xs sm:text-sm"
                        />
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none hidden md:flex items-center gap-0.5 text-[10px] font-semibold text-slate-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/60 rounded px-1.5 py-0.5 shadow-2xs">
                            <span className="text-[9px]">⌘</span>K
                        </div>
                    </div>
                </div>

                {/* Right section */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    {/* Theme Toggle */}
                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => dispatch(toggleTheme())} 
                        className="h-9 w-9 border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs rounded-lg"
                        title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                    >
                        {theme === "light" ? (
                            <MoonIcon className="h-4 w-4 text-slate-700" />
                        ) : (
                            <SunIcon className="h-4 w-4 text-amber-400" />
                        )}
                    </Button>

                    {/* User Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 shadow-2xs hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-all outline-none cursor-pointer">
                                <Avatar className="h-7 w-7">
                                    <AvatarImage src={user?.image} alt={user?.name || 'User Avatar'} />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs font-semibold">
                                        {userInitials}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-zinc-200 hidden md:inline-block max-w-[120px] truncate">
                                    {user?.name || user?.email?.split('@')[0] || 'Account'}
                                </span>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 mt-1">
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-semibold leading-none text-slate-900 dark:text-zinc-100">{user?.name || 'User'}</p>
                                    <p className="text-xs leading-none text-slate-500 dark:text-zinc-400 truncate">{user?.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                                <User className="mr-2 h-4 w-4 text-slate-500" />
                                <span>Profile & Account</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                                <Settings className="mr-2 h-4 w-4 text-slate-500" />
                                <span>Workspace Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={logout} className="text-rose-600 dark:text-rose-400 cursor-pointer focus:bg-rose-50 dark:focus:bg-rose-950/40">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Sign Out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}

export default Navbar
