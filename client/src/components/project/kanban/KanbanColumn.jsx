import { Trash2 } from 'lucide-react';
import KanbanCard from '@/components/project/kanban/KanbanCard';

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
    navigate
}) {
    const isBaseStage = ["TODO", "IN_PROGRESS", "DONE"].includes(column.id);

    return (
        <div
            draggable={canManageStages}
            onDragStart={(e) => onColumnDragStart(e, index)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, column.id)}
            className={`w-[300px] flex-shrink-0 flex flex-col rounded-2xl border ${column.border} bg-slate-50/50 dark:bg-zinc-900/30 p-4 min-h-[500px] transition-colors cursor-grab active:cursor-grabbing text-left`}
        >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-gray-800 dark:text-zinc-200 capitalize">
                        {column.title.toLowerCase()}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400">
                        {columnTasks.length}
                    </span>
                </div>
                {!isBaseStage && canManageStages && (
                    <button
                        onClick={() => handleDeleteColumn(column.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                        title="Delete Column"
                    >
                        <Trash2 className="size-3.5" />
                    </button>
                )}
            </div>

            {/* Column Tasks */}
            <div className="flex flex-col gap-3 flex-1">
                {columnTasks.length > 0 ? (
                    columnTasks.map((task) => (
                        <KanbanCard
                            key={task.id}
                            task={task}
                            onTaskDragStart={onTaskDragStart}
                            navigate={navigate}
                        />
                    ))
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-zinc-800/50 rounded-xl py-8 px-4 text-center">
                        <p className="text-xs text-gray-400 dark:text-zinc-500">
                            Drag tasks here
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
