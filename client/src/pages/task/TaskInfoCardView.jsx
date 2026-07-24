import { format } from 'date-fns';
import { CalendarIcon, Edit3, Trash2, CheckCircle2 } from 'lucide-react';

export default function TaskInfoCardView({ task, onEdit, onDelete, onMarkAsDone }) {
    return (
        <div>
            <div className="flex justify-between items-start gap-4 mb-4">
                <div className="space-y-1">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100 tracking-tight leading-snug">{task.title}</h1>
                    <div className="flex flex-wrap gap-2 pt-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 text-xs font-semibold tracking-wide border border-zinc-200 dark:border-zinc-700/60 uppercase">{task.status.replace(/_/g, " ").toLowerCase()}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-semibold tracking-wide border border-blue-150 dark:border-blue-900/60 uppercase">{task.type}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold tracking-wide border border-emerald-150 dark:border-emerald-900/60 uppercase">{task.priority}</span>
                    </div>
                </div>
                
                <div className="flex gap-2 items-center">
                    {task.status !== "DONE" && (
                        <button
                            onClick={onMarkAsDone}
                            className="p-1.5 flex items-center justify-center gap-1.5 rounded-md border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/80 transition cursor-pointer text-xs font-semibold"
                            title="Mark Task as Done"
                        >
                            <CheckCircle2 className="size-4" />
                            <span>Done</span>
                        </button>
                    )}
                    <button
                        onClick={onEdit}
                        className="p-1.5 rounded-md border border-gray-300 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                        title="Edit Task"
                    >
                        <Edit3 className="size-4" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1.5 rounded-md border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/60 transition cursor-pointer"
                        title="Delete Task"
                    >
                        <Trash2 className="size-4" />
                    </button>
                </div>
            </div>

            {task.description ? (
                <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed mb-6 whitespace-pre-wrap">{task.description}</p>
            ) : (
                <p className="text-sm text-zinc-400 dark:text-zinc-500 italic mb-6">No description provided.</p>
            )}

            <hr className="border-zinc-200 dark:border-zinc-800 my-4" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-zinc-700 dark:text-zinc-300">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-zinc-400 uppercase w-20">Assignee:</span>
                    <div className="flex items-center gap-2">
                        {task.assignee?.image ? (
                            <img src={task.assignee.image} className="size-6 rounded-full object-cover" alt="avatar" />
                        ) : (
                            <div className="size-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold">
                                {task.assignee?.name?.charAt(0).toUpperCase() || "?"}
                            </div>
                        )}
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                            {task.assignee?.name || "Unassigned"}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-zinc-400 uppercase w-20">Start Date:</span>
                    <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                        <CalendarIcon className="size-4 text-zinc-400" />
                        <span>
                            {task.start_date ? format(new Date(task.start_date), "dd MMM yyyy") : "-"}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3 sm:col-start-2">
                    <span className="text-xs font-semibold text-zinc-400 uppercase w-20">Due Date:</span>
                    <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                        <CalendarIcon className="size-4 text-zinc-400" />
                        <span>
                            {format(new Date(task.due_date), "dd MMM yyyy")}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
