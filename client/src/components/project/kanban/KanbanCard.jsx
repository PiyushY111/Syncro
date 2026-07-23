import { format } from 'date-fns';
import { Bug, CalendarIcon, GitCommit, MessageSquare, Square, Zap, Lock } from 'lucide-react';

const typeIcons = {
    BUG: { icon: Bug, color: "text-red-600 dark:text-red-400" },
    FEATURE: { icon: Zap, color: "text-blue-600 dark:text-blue-400" },
    TASK: { icon: Square, color: "text-green-600 dark:text-green-400" },
    IMPROVEMENT: { icon: GitCommit, color: "text-purple-600 dark:text-purple-400" },
    OTHER: { icon: MessageSquare, color: "text-amber-600 dark:text-amber-400" },
};

const priorityTexts = {
    LOW: { background: "bg-red-100 dark:bg-red-950", prioritycolor: "text-red-600 dark:text-red-400" },
    MEDIUM: { background: "bg-blue-100 dark:bg-blue-950", prioritycolor: "text-blue-600 dark:text-blue-400" },
    HIGH: { background: "bg-emerald-100 dark:bg-emerald-950", prioritycolor: "text-emerald-600 dark:text-emerald-400" },
};

export default function KanbanCard({ task, onTaskDragStart, navigate }) {
    const { icon: Icon, color } = typeIcons[task.type] || {};
    const { background, prioritycolor } = priorityTexts[task.priority] || {};

    return (
        <div
            draggable
            onDragStart={(e) => onTaskDragStart(e, task.id)}
            onClick={() => navigate(`/taskDetails?projectId=${task.projectId}&taskId=${task.id}`)}
            className="group bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm hover:shadow-md dark:hover:border-zinc-700 transition cursor-grab active:cursor-grabbing flex flex-col gap-3 text-left"
        >
            <h4 className="font-medium text-sm text-gray-800 dark:text-zinc-100 line-clamp-2 flex items-center gap-1.5">
                {task.dependencies?.some(d => d.status !== "DONE") && (
                    <Lock className="size-3.5 text-amber-500 flex-shrink-0" title="Blocked by prerequisites" />
                )}
                <span>{task.title}</span>
            </h4>

            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs">
                    {Icon && <Icon className={`size-3.5 ${color}`} />}
                    <span className={`uppercase font-medium text-[11px] ${color}`}>{task.type}</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${background} ${prioritycolor}`}>
                    {task.priority}
                </span>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 dark:border-zinc-800/80 pt-3 mt-1">
                <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-zinc-400">
                    <CalendarIcon className="size-3.5" />
                    <span>{format(new Date(task.due_date), "dd MMM")}</span>
                </div>
                {task.assignee && (
                    <div className="flex items-center gap-1.5">
                        {task.assignee.image ? (
                            <img
                                src={task.assignee.image}
                                alt={task.assignee.name}
                                title={task.assignee.name}
                                className="size-5 rounded-full border border-white dark:border-zinc-800 object-cover"
                            />
                        ) : (
                            <div
                                title={task.assignee.name}
                                className="size-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-[9px] font-bold border border-white dark:border-zinc-800"
                            >
                                {task.assignee.name?.charAt(0).toUpperCase() || "?"}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
