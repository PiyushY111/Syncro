/**
 * Global Navigation Header Component with Live Workspace Search
 */
import { SearchIcon, PanelLeft, LogOut, MoonIcon, SunIcon, User, Settings, Bell, X, Command, FolderKanban, CheckSquare, LayoutDashboard, Inbox, Calendar, Edit3, ArrowRight } from 'lucide-react'

import { useState, useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleTheme } from '@/features/themeSlice'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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

const NAV_PAGES = [
    { name: "Dashboard Overview", path: "/dashboard", icon: LayoutDashboard },
    { name: "Projects & Initiatives", path: "/projects", icon: FolderKanban },
    { name: "Inbox & Notifications", path: "/inbox", icon: Inbox },
    { name: "Calendar Schedule", path: "/calendar", icon: Calendar },
    { name: "Whiteboard Canvas", path: "/whiteboard", icon: Edit3 },
    { name: "Account Settings", path: "/settings", icon: Settings },
];

const Navbar = ({ setIsSidebarOpen }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { theme } = useSelector(state => state.theme);
    const { user, logout } = useAuth();
    const currentWorkspace = useSelector((state) => state?.workspace?.currentWorkspace || null);

    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const searchRef = useRef(null);
    const containerRef = useRef(null);

    // Global keyboard shortcut (⌘K / Ctrl+K and Esc)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchRef.current?.focus();
                setIsOpen(true);
            } else if (e.key === 'Escape') {
                setIsOpen(false);
                searchRef.current?.blur();
            }
        };

        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Filter projects, tasks, and pages
    const query = searchTerm.toLowerCase().trim();

    const matchedProjects = query ? (currentWorkspace?.projects || []).filter(p => 
        p.name?.toLowerCase().includes(query) || (p.description && p.description.toLowerCase().includes(query))
    ) : [];

    const matchedTasks = query ? (currentWorkspace?.projects || []).flatMap(p => 
        (p.tasks || []).map(t => ({ ...t, projectName: p.name }))
    ).filter(t => 
        t.title?.toLowerCase().includes(query) || (t.description && t.description.toLowerCase().includes(query))
    ) : [];

    const matchedPages = query ? NAV_PAGES.filter(p => 
        p.name.toLowerCase().includes(query)
    ) : NAV_PAGES.slice(0, 3);

    const hasResults = matchedProjects.length > 0 || matchedTasks.length > 0 || matchedPages.length > 0;

    const handleSelect = (path) => {
        navigate(path);
        setIsOpen(false);
        setSearchTerm("");
    };

    const userInitials = user?.name 
        ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : (user?.email ? user.email.charAt(0).toUpperCase() : 'U');

    return (
        <header className="w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800/80 px-4 sm:px-6 xl:px-12 py-2.5 flex-shrink-0 sticky top-0 z-30">
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

                    {/* Search Input with Interactive Global Palette Dropdown */}
                    <div ref={containerRef} className="relative flex-1 max-w-md hidden sm:block">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 h-4 w-4" />
                        <Input
                            ref={searchRef}
                            type="text"
                            value={searchTerm}
                            onFocus={() => setIsOpen(true)}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setIsOpen(true);
                            }}
                            placeholder="Search projects, tasks, workspace..."
                            className="pl-9 pr-12 h-9 bg-slate-50/60 dark:bg-zinc-800/50 border-slate-200/80 dark:border-zinc-700/60 focus-visible:ring-blue-500/30 rounded-lg text-xs sm:text-sm"
                        />
                        {searchTerm ? (
                            <button 
                                onClick={() => {
                                    setSearchTerm("");
                                    setIsOpen(false);
                                }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-0.5 rounded-full"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        ) : (
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none hidden md:flex items-center gap-0.5 text-[10px] font-semibold text-slate-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/60 rounded px-1.5 py-0.5 shadow-2xs">
                                <span className="text-[9px]">⌘</span>K
                            </div>
                        )}

                        {/* Floating Autocomplete Results Dropdown */}
                        {isOpen && (
                            <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden text-left max-h-96 overflow-y-auto animate-fade-in divide-y divide-slate-100 dark:divide-zinc-800/60">
                                {query && !hasResults ? (
                                    <div className="p-6 text-center text-xs text-slate-400 dark:text-zinc-500">
                                        No results found for "<span className="font-semibold text-slate-700 dark:text-zinc-300">{searchTerm}</span>"
                                    </div>
                                ) : (
                                    <>
                                        {/* Matched Projects */}
                                        {matchedProjects.length > 0 && (
                                            <div className="p-2 space-y-1">
                                                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                                                    Projects ({matchedProjects.length})
                                                </div>
                                                {matchedProjects.slice(0, 4).map((p) => (
                                                    <div 
                                                        key={p.id}
                                                        onClick={() => handleSelect(`/projectsDetail?id=${p.id}&tab=tasks`)}
                                                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/70 cursor-pointer transition-colors group"
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
                                                                <FolderKanban className="h-3.5 w-3.5" />
                                                            </div>
                                                            <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                                                {p.name}
                                                            </span>
                                                        </div>
                                                        <Badge variant="outline" className="text-[9px] py-0 px-1.5 capitalize shrink-0 font-medium">
                                                            {p.status ? p.status.replace('_', ' ').toLowerCase() : 'active'}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Matched Tasks */}
                                        {matchedTasks.length > 0 && (
                                            <div className="p-2 space-y-1">
                                                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                                                    Tasks ({matchedTasks.length})
                                                </div>
                                                {matchedTasks.slice(0, 4).map((t) => (
                                                    <div 
                                                        key={t.id}
                                                        onClick={() => handleSelect(`/taskDetails?projectId=${t.projectId}&taskId=${t.id}`)}
                                                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/70 cursor-pointer transition-colors group"
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                                                                <CheckSquare className="h-3.5 w-3.5" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                                                    {t.title}
                                                                </p>
                                                                <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                                                                    In {t.projectName}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Badge variant="outline" className="text-[9px] py-0 px-1.5 uppercase shrink-0 font-medium">
                                                            {t.priority ? t.priority.toLowerCase() : 'normal'}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Quick Navigation Pages */}
                                        {matchedPages.length > 0 && (
                                            <div className="p-2 space-y-1">
                                                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                                                    Quick Navigation
                                                </div>
                                                {matchedPages.map((page) => {
                                                    const PageIcon = page.icon;
                                                    return (
                                                        <div 
                                                            key={page.path}
                                                            onClick={() => handleSelect(page.path)}
                                                            className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/70 cursor-pointer transition-colors group"
                                                        >
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 shrink-0">
                                                                    <PageIcon className="h-3.5 w-3.5" />
                                                                </div>
                                                                <span className="text-xs font-medium text-slate-700 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                                                    {page.name}
                                                                </span>
                                                            </div>
                                                            <ArrowRight className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
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
