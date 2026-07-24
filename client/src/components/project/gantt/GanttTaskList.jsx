import { Milestone, Calendar as CalendarIcon, ChevronDown, ChevronRight, MoreHorizontal } from 'lucide-react';

const STATUS_CONFIG = {
    IN_PROGRESS: { label: 'In progress', dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700' },
    TODO: { label: 'To do', dot: 'bg-violet-400', badge: 'bg-violet-50 text-violet-700' },
    DONE: { label: 'Completed', dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700' }
};

export default function GanttTaskList({ taskListRef, taskPanelWidth, onResizeStart, filteredTasks, criticalPathTaskIds, handleOpenEdit, onViewInCalendar, groupByStatus, expandedGroups, setExpandedGroups }) {
    const groups = ['IN_PROGRESS', 'TODO', 'DONE'].map((key) => ({ key, config: STATUS_CONFIG[key], tasks: filteredTasks.filter((task) => task.status === key) })).filter((group) => group.tasks.length || !groupByStatus);
    const toggleGroup = (key) => setExpandedGroups((previous) => ({ ...previous, [key]: !previous[key] }));

    return (
        <aside ref={taskListRef} style={{ width: taskPanelWidth }} className="relative flex-shrink-0 overflow-hidden border-r border-slate-200 bg-white">
            <div className="flex h-[52px] items-center justify-between border-b border-slate-200 bg-slate-50 px-5 text-[11px] font-bold uppercase tracking-[.12em] text-slate-500"><span>Tasks</span><span className="hidden sm:inline">Drag edge to resize</span></div>
            <div className="overflow-y-auto">
                {!filteredTasks.length && <div className="p-8 text-center text-sm text-slate-400">No tasks match these filters.</div>}
                {!groupByStatus && filteredTasks.map((task, index) => <TaskRow key={task.id} task={task} index={index} isCritical={criticalPathTaskIds.has(task.id)} handleOpenEdit={handleOpenEdit} onViewInCalendar={onViewInCalendar} />)}
                {groupByStatus && groups.map((group) => {
                    const open = expandedGroups[group.key] !== false;
                    return <div key={group.key}>
                        <button type="button" onClick={() => toggleGroup(group.key)} className="flex h-10 w-full items-center justify-between border-b border-slate-100 bg-slate-50 px-4 text-left text-xs font-bold text-slate-700 hover:bg-slate-100"><span className="flex items-center gap-2">{open ? <ChevronDown className="size-3.5 text-slate-400" /> : <ChevronRight className="size-3.5 text-slate-400" />}<span className={`size-2 rounded-full ${group.config.dot}`} />{group.config.label}</span><span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-400 shadow-sm">{group.tasks.length}</span></button>
                        {open && group.tasks.map((task, index) => <TaskRow key={task.id} task={task} index={index} isCritical={criticalPathTaskIds.has(task.id)} handleOpenEdit={handleOpenEdit} onViewInCalendar={onViewInCalendar} />)}
                    </div>;
                })}
            </div>
            <div onMouseDown={onResizeStart} className="group absolute inset-y-0 -right-1 z-40 hidden w-2 cursor-col-resize items-center justify-center md:flex" title="Drag to resize task panel"><span className="h-12 w-1 rounded-full bg-transparent transition group-hover:bg-violet-400" /></div>
        </aside>
    );
}

function TaskRow({ task, index, isCritical, handleOpenEdit, onViewInCalendar }) {
    const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.TODO;
    return (
        <div onClick={() => handleOpenEdit(task)} className={`group flex h-12 cursor-pointer items-center gap-2 border-b border-slate-100 px-4 transition hover:bg-violet-50/60 ${isCritical ? 'border-l-2 border-l-amber-400 bg-amber-50/40' : ''}`}>
            {task.type === 'OTHER' ? <Milestone className="size-4 shrink-0 text-violet-500" /> : <span className={`size-2 shrink-0 rounded-full ${status.dot}`} />}
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-700 group-hover:text-violet-700">{task.title}</p><p className="mt-0.5 text-[10px] text-slate-400">SYNC-{index + 101}</p></div>
            <span className={`hidden rounded-md px-1.5 py-0.5 text-[9px] font-bold sm:inline ${status.badge}`}>{task.status.replace('_', ' ')}</span>
            {onViewInCalendar && <button type="button" onClick={(event) => { event.stopPropagation(); onViewInCalendar(task); }} className="hidden rounded-md p-1 text-slate-400 hover:bg-white hover:text-violet-600 group-hover:block" title="View in calendar"><CalendarIcon className="size-3.5" /></button>}
            <MoreHorizontal className="size-4 shrink-0 text-slate-300" />
        </div>
    );
}
