import { Search, Filter, CalendarRange, CheckSquare, Users, Sparkles } from 'lucide-react';

export default function SmartCalendarFilters({
    searchQuery,
    setSearchQuery,
    selectedProject,
    setSelectedProject,
    projects = [],
    showTasks,
    setShowTasks,
    showMeetings,
    setShowMeetings,
    showGCal,
    setShowGCal
}) {
    return (
        <div className="bg-slate-500/[0.05] dark:bg-white/[0.03] border border-slate-900/[0.07] dark:border-white/[0.07] rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search and Project Filter */}
            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 size-4 text-zinc-400 dark:text-zinc-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search calendar events..."
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-white/70 dark:bg-white/[0.04] border border-slate-900/[0.07] dark:border-white/[0.07] text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/25 transition"
                    />
                </div>
                <div className="relative">
                    <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="w-full sm:w-48 pl-3 pr-8 py-2 text-sm rounded-xl bg-white/70 dark:bg-white/[0.04] border border-slate-900/[0.07] dark:border-white/[0.07] text-zinc-900 dark:text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/25 transition appearance-none cursor-pointer"
                    >
                        <option value="ALL">All Projects</option>
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-3 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-500 dark:border-t-zinc-400"></div>
                </div>
            </div>

            {/* Checkbox filters */}
            <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                {/* Tasks filter */}
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <input
                        type="checkbox"
                        checked={showTasks}
                        onChange={() => setShowTasks(!showTasks)}
                        className="sr-only"
                    />
                    <div className={`size-4 rounded border transition flex items-center justify-center ${showTasks ? 'bg-brand border-brand dark:border-lime text-white' : 'border-slate-900/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.02]'}`}>
                        {showTasks && <CheckSquare className="size-3" />}
                    </div>
                    <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-950 dark:group-hover:text-white transition">
                        <span className="size-2 rounded-full bg-brand"></span>
                        Tasks
                    </span>
                </label>

                {/* Meetings filter */}
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <input
                        type="checkbox"
                        checked={showMeetings}
                        onChange={() => setShowMeetings(!showMeetings)}
                        className="sr-only"
                    />
                    <div className={`size-4 rounded border transition flex items-center justify-center ${showMeetings ? 'bg-brand border-brand dark:border-lime text-white' : 'border-slate-900/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.02]'}`}>
                        {showMeetings && <Users className="size-3" />}
                    </div>
                    <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-950 dark:group-hover:text-white transition">
                        <span className="size-2 rounded-full bg-brand"></span>
                        Meetings
                    </span>
                </label>

                {/* Google Calendar Sync filter */}
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <input
                        type="checkbox"
                        checked={showGCal}
                        onChange={() => setShowGCal(!showGCal)}
                        className="sr-only"
                    />
                    <div className={`size-4 rounded border transition flex items-center justify-center ${showGCal ? 'bg-amber-600 border-amber-600 text-white' : 'border-slate-900/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.02]'}`}>
                        {showGCal && <Sparkles className="size-3" />}
                    </div>
                    <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-950 dark:group-hover:text-white transition">
                        <span className="size-2 rounded-full bg-amber-500"></span>
                        Google Sync
                    </span>
                </label>
            </div>
        </div>
    );
}
