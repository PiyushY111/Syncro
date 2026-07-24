import { Search, Link2, Zap, Milestone } from 'lucide-react';

export default function GanttHeader({
    zoom, setZoom, searchQuery, setSearchQuery,
    statusFilter, setStatusFilter, showDependencies, setShowDependencies,
    highlightCriticalPath, setHighlightCriticalPath, milestonesOnly, setMilestonesOnly
}) {
    return (
        <div className="p-4 bg-zinc-950/80 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1">
                    <span className="text-xs text-zinc-400 px-2 font-medium">Scale:</span>
                    {['day', 'week', 'month'].map(mode => (
                        <button
                            key={mode}
                            onClick={() => setZoom(mode)}
                            className={`px-3 py-1 text-xs capitalize font-semibold rounded-md transition-all cursor-pointer ${
                                zoom === mode ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                            }`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 size-3.5 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Filter Gantt tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 text-xs rounded-lg pl-8 pr-3 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500 w-44 md:w-56"
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 text-xs rounded-lg px-2.5 py-1.5 text-zinc-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                    <option value="ALL">All Statuses</option>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Completed</option>
                </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={() => setShowDependencies(!showDependencies)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition cursor-pointer ${
                        showDependencies ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                >
                    <Link2 className="size-3.5" /> Dependencies
                </button>

                <button
                    onClick={() => setHighlightCriticalPath(!highlightCriticalPath)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition cursor-pointer ${
                        highlightCriticalPath ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-amber-400'
                    }`}
                >
                    <Zap className="size-3.5" /> Critical Path
                </button>

                <button
                    onClick={() => setMilestonesOnly(!milestonesOnly)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition cursor-pointer ${
                        milestonesOnly ? 'bg-purple-500/20 border-purple-500/40 text-purple-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-purple-400'
                    }`}
                >
                    <Milestone className="size-3.5" /> Milestones Only
                </button>
            </div>
        </div>
    );
}
