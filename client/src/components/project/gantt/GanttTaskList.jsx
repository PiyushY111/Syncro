import { useState } from 'react';
import { Milestone, Link2, Edit3, Calendar as CalendarIcon, ChevronDown, ChevronRight, Plus } from 'lucide-react';

const STATUS_CONFIG = {
    IN_PROGRESS: { label: 'In Progress', bg: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30', fill: 'bg-amber-500' },
    TODO: { label: 'To Do', bg: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-500/20 dark:text-zinc-400 dark:border-zinc-500/30', fill: 'bg-zinc-400' },
    DONE: { label: 'Completed', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30', fill: 'bg-emerald-500' }
};

export default function GanttTaskList({ taskListRef, filteredTasks, criticalPathTaskIds, handleOpenEdit, onViewInCalendar, groupByStatus, expandedGroups, setExpandedGroups }) {
    const toggleGroup = (statusKey) => {
        setExpandedGroups(prev => ({ ...prev, [statusKey]: !prev[statusKey] }));
    };

    const statusGroups = ['IN_PROGRESS', 'TODO', 'DONE'].map(statusKey => {
        const groupTasks = filteredTasks.filter(t => t.status === statusKey);
        return { key: statusKey, config: STATUS_CONFIG[statusKey], tasks: groupTasks };
    }).filter(g => g.tasks.length > 0 || !groupByStatus);

    return (
        <div ref={taskListRef} className="w-80 md:w-96 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 overflow-hidden flex flex-col select-none">
            <div className="h-13 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/90 px-4 flex items-center justify-between text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                <span>Task Name & Key</span>
                <span className="pr-2">Status & Actions</span>
            </div>

            <div className="divide-y divide-zinc-200/70 dark:divide-zinc-800/60 overflow-y-auto">
                {filteredTasks.length === 0 ? (
                    <div className="p-8 text-center text-xs text-zinc-500">No tasks match current Gantt filters.</div>
                ) : !groupByStatus ? (
                    filteredTasks.map((task, idx) => <TaskRow key={task.id} task={task} index={idx} isCritical={criticalPathTaskIds.has(task.id)} handleOpenEdit={handleOpenEdit} onViewInCalendar={onViewInCalendar} />)
                ) : (
                    statusGroups.map((group) => {
                        const isExpanded = expandedGroups[group.key] !== false;
                        const doneCount = group.tasks.filter(t => t.status === 'DONE').length;
                        const groupPercent = group.tasks.length > 0 ? Math.round((doneCount / group.tasks.length) * 100) : 0;

                        return (
                            <div key={group.key}>
                                <div onClick={() => toggleGroup(group.key)} className="h-9 px-3 bg-zinc-100/90 dark:bg-zinc-900/80 hover:bg-zinc-200/70 dark:hover:bg-zinc-850 flex items-center justify-between text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border-b border-zinc-200/60 dark:border-zinc-800/50">
                                    <div className="flex items-center gap-2">
                                        {isExpanded ? <ChevronDown className="size-3.5 text-zinc-500" /> : <ChevronRight className="size-3.5 text-zinc-500" />}
                                        <span>{group.config?.label || group.key}</span>
                                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">{group.tasks.length}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                                        <span>{groupPercent}%</span>
                                    </div>
                                </div>

                                {isExpanded && group.tasks.map((task, idx) => (
                                    <TaskRow key={task.id} task={task} index={idx} isCritical={criticalPathTaskIds.has(task.id)} handleOpenEdit={handleOpenEdit} onViewInCalendar={onViewInCalendar} />
                                ))}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

function TaskRow({ task, index, isCritical, handleOpenEdit, onViewInCalendar }) {
    const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.TODO;
    const taskKey = `SYNC-${index + 101}`;

    return (
        <div onClick={() => handleOpenEdit(task)} className={`h-11 px-4 flex items-center justify-between gap-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors cursor-pointer group ${isCritical ? 'bg-amber-50/80 dark:bg-amber-950/20 border-l-2 border-l-amber-500' : ''}`}>
            <div className="flex items-center gap-2 min-w-0 flex-1">
                {task.type === 'OTHER' ? <Milestone className="size-3.5 text-purple-600 shrink-0" /> : <span className={`size-2 rounded-full shrink-0 ${statusConfig.fill}`} />}
                <span className="text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-500 shrink-0">{taskKey}</span>
                <span className="truncate font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-white">{task.title}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${statusConfig.bg}`}>{task.status.replace('_', ' ')}</span>
                {onViewInCalendar && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); onViewInCalendar(task); }} title="Jump to Calendar" className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-950 text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <CalendarIcon className="size-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}
