import { Milestone, Link2, Edit3 } from 'lucide-react';

const STATUS_COLOR = {
    TODO: { bg: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30', fill: 'bg-zinc-400' },
    IN_PROGRESS: { bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30', fill: 'bg-amber-400' },
    DONE: { bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', fill: 'bg-emerald-400' }
};

export default function GanttTaskList({ taskListRef, filteredTasks, criticalPathTaskIds, handleOpenEdit }) {
    return (
        <div 
            ref={taskListRef}
            className="w-80 md:w-96 flex-shrink-0 border-r border-zinc-800 bg-zinc-950/60 overflow-hidden flex flex-col select-none"
        >
            <div className="h-12 border-b border-zinc-800 bg-zinc-900/90 px-4 flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <span>Task Name</span>
                <span className="pr-4">Dates & Status</span>
            </div>

            <div className="divide-y divide-zinc-850/60 overflow-y-auto">
                {filteredTasks.length === 0 ? (
                    <div className="p-8 text-center text-xs text-zinc-500">
                        No tasks match the current Gantt filters.
                    </div>
                ) : (
                    filteredTasks.map((task) => {
                        const isCritical = criticalPathTaskIds.has(task.id);
                        const hasDeps = task.dependencies && task.dependencies.length > 0;
                        const statusConfig = STATUS_COLOR[task.status] || STATUS_COLOR.TODO;

                        return (
                            <div 
                                key={task.id}
                                onClick={() => handleOpenEdit(task)}
                                className={`h-11 px-4 flex items-center justify-between gap-3 text-xs hover:bg-zinc-850/80 transition-colors cursor-pointer group ${
                                    isCritical ? 'bg-amber-950/20 border-l-2 border-l-amber-500' : ''
                                }`}
                            >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    {task.type === 'OTHER' ? (
                                        <Milestone className="size-3.5 text-purple-400 shrink-0" />
                                    ) : (
                                        <span className={`size-2 rounded-full shrink-0 ${statusConfig.fill}`} />
                                    )}
                                    
                                    <span className="truncate font-medium text-zinc-200 group-hover:text-white">
                                        {task.title}
                                    </span>

                                    {hasDeps && (
                                        <span title={`${task.dependencies.length} prerequisites`} className="flex items-center text-[10px] text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/40">
                                            <Link2 className="size-2.5 mr-0.5" />
                                            {task.dependencies.length}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-[10px] px-2 py-0.5 rounded border ${statusConfig.bg}`}>
                                        {task.status.replace('_', ' ')}
                                    </span>

                                    <button 
                                        className="p-1 rounded hover:bg-zinc-700 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Quick Edit Timeline"
                                    >
                                        <Edit3 className="size-3" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
