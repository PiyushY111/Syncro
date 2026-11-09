/**
 * Board card: title first, then type, priority, due date and assignee in one quiet footer.
 */
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskTypeIcon, PriorityBars, DueDate, Assignee } from '@/components/project/tasks/taskMeta';

export default function KanbanCard({ task, onTaskDragStart, navigate }) {
    const isBlocked = task.dependencies?.some((d) => d.status !== 'DONE');
    const open = () => navigate(`/taskDetails?projectId=${task.projectId}&taskId=${task.id}`);

    return (
        <div
            role="button"
            tabIndex={0}
            draggable
            onDragStart={(e) => onTaskDragStart(e, task.id)}
            onClick={open}
            onKeyDown={(e) => { if (e.key === 'Enter') open(); }}
            className="group flex cursor-grab flex-col gap-3 rounded-2xl border border-white/80 bg-white/80 p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-14px_rgba(30,27,75,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 active:cursor-grabbing dark:border-white/[0.06] dark:bg-white/[0.05] dark:hover:bg-white/[0.07]"
        >
            <div className="flex items-start gap-2">
                <TaskTypeIcon type={task.type} className="mt-0.5" />
                <h4 className={cn('line-clamp-2 text-sm font-medium leading-snug', task.status === 'DONE' ? 'text-slate-400 line-through dark:text-zinc-500' : 'text-slate-900 dark:text-zinc-100')}>
                    {task.title}
                </h4>
            </div>
            {isBlocked && (
                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                    <Lock className="h-3 w-3" /> Blocked
                </span>
            )}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                    <PriorityBars priority={task.priority} />
                    <DueDate task={task} />
                </div>
                {task.assignee && <Assignee user={task.assignee} compact />}
            </div>
        </div>
    );
}
