/**
 * Board column: status dot + name + count header, cards, and a clear drop highlight while dragging.
 */
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import KanbanCard from '@/components/project/kanban/KanbanCard';
import { formatStage } from '@/components/project/detail/taskFiltering';

const BASE_STAGES = ['TODO', 'IN_PROGRESS', 'DONE'];
const STAGE_DOT = { TODO: 'bg-slate-400', IN_PROGRESS: 'bg-amber-500', DONE: 'bg-emerald-500' };

export default function KanbanColumn({
    column,
    index,
    columnTasks,
    canManageStages,
    onColumnDragStart,
    onDragOver,
    onDrop,
    onTaskDragStart,
    handleDeleteColumn,
    navigate,
}) {
    const [isOver, setIsOver] = useState(false);
    const isBaseStage = BASE_STAGES.includes(column.id);

    return (
        <section
            aria-label={`${formatStage(column.id)} column`}
            onDragOver={(e) => { onDragOver(e); setIsOver(true); }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsOver(false); }}
            onDrop={(e) => { setIsOver(false); onDrop(e, column.id); }}
            className={cn(
                'flex min-h-[420px] w-[300px] shrink-0 flex-col rounded-3xl p-3 transition-colors',
                isOver ? 'bg-brand/10 ring-2 ring-inset ring-brand/40 dark:bg-lime/[0.06] dark:ring-lime/40' : 'bg-slate-500/[0.06] dark:bg-white/[0.03]'
            )}
        >
            <header
                draggable={canManageStages}
                onDragStart={(e) => onColumnDragStart(e, index)}
                className={cn('mb-3 flex items-center justify-between px-2 pt-1', canManageStages && 'cursor-grab active:cursor-grabbing')}
                title={canManageStages ? 'Drag to reorder columns' : undefined}
            >
                <div className="flex items-center gap-2">
                    <span className={cn('h-2 w-2 rounded-full', STAGE_DOT[column.id] || 'bg-brand dark:bg-lime')} />
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">{formatStage(column.id)}</h3>
                    <span className="font-data rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-white/[0.06] dark:text-zinc-400">{columnTasks.length}</span>
                </div>
                {!isBaseStage && canManageStages && (
                    <button
                        type="button"
                        onClick={() => handleDeleteColumn(column.id)}
                        aria-label={`Delete ${formatStage(column.id)} column`}
                        className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                )}
            </header>

            <div className="flex flex-1 flex-col gap-2.5">
                {columnTasks.length > 0 ? (
                    columnTasks.map((task) => (
                        <KanbanCard key={task.id} task={task} onTaskDragStart={onTaskDragStart} navigate={navigate} />
                    ))
                ) : (
                    <div className="flex flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-slate-900/[0.08] px-4 py-10 text-center dark:border-white/[0.08]">
                        <p className="text-xs text-slate-400 dark:text-zinc-500">Drop tasks here</p>
                    </div>
                )}
            </div>
        </section>
    );
}
