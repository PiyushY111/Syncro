import { SearchIcon, PanelLeft, LogOut } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleTheme } from '@/features/themeSlice'
import { MoonIcon, SunIcon } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const Navbar = ({ setIsSidebarOpen }) => {

    const dispatch = useDispatch();
    const { theme } = useSelector(state => state.theme);
    const { user, logout } = useAuth();

    return (
        <div className="w-full bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 xl:px-16 py-3 flex-shrink-0">
            <div className="flex items-center justify-between max-w-6xl mx-auto">
                {/* Left section */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Sidebar Trigger */}
                    <button onClick={() => setIsSidebarOpen((prev) => !prev)} className="sm:hidden p-2 rounded-lg transition-colors text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800" >
                        <PanelLeft size={20} />
                    </button>

                    {/* Search Input */}
                    <div className="relative flex-1 max-w-sm">
                        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-400 size-3.5" />
                        <input
                            type="text"
                            placeholder="Search projects, tasks..."
                            className="pl-8 pr-4 py-2 w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-md text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                    </div>
                </div>

                {/* Right section */}
                <div className="flex items-center gap-3">

                    {/* Theme Toggle */}
                    <button onClick={() => dispatch(toggleTheme())} className="size-8 flex items-center justify-center bg-white dark:bg-zinc-800 shadow rounded-lg transition hover:scale-105 active:scale-95">
                        {
                            theme === "light"
                                ? (<MoonIcon className="size-4 text-gray-800 dark:text-gray-200" />)
                                : (<SunIcon className="size-4 text-yellow-400" />)
                        }
                    </button>

                    {/* User Menu */}
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2">
                        {user?.image ? (
                            <img src={user.image} alt={user.name} className="w-6 h-6 rounded-full object-cover border border-gray-100 dark:border-zinc-600 flex-shrink-0" />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                                {user?.name ? user.name.charAt(0) : "U"}
                            </div>
                        )}
                        <span className="text-sm text-gray-700 dark:text-zinc-200">
                            {user?.name || user?.email?.split('@')[0] || 'User'}
                        </span>
                        <button onClick={logout} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-700" title="Logout">
                            <LogOut className="size-4 text-gray-600 dark:text-zinc-300" />
                        </button>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default Navbar
