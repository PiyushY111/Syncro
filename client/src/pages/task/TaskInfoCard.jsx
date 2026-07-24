import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

export default function TaskInfoCard({ task }) {
    return (
        <div className="p-5 rounded-md bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800 text-left">
            <div className="mb-3">
                <h1 className="text-lg font-medium text-gray-900 dark:text-zinc-100">{task.title}</h1>
                <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-300 text-xs font-semibold">{task.status}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-300 text-xs font-semibold">{task.type}</span>
                    <span className="px-2 py-0.5 rounded bg-green-200 dark:bg-emerald-900 text-green-900 dark:text-emerald-300 text-xs font-semibold">{task.priority}</span>
                </div>
            </div>

            {task.description && (
                <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed mb-4">{task.description}</p>
            )}

            <hr className="border-zinc-200 dark:border-zinc-700 my-3" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-zinc-300">
                <div className="flex items-center gap-2">
                    <img src={task.assignee?.image} className="size-5 rounded-full" alt="avatar" />
                    {task.assignee?.name || "Unassigned"}
                </div>
                <div className="flex items-center gap-2">
                    <CalendarIcon className="size-4 text-gray-500 dark:text-zinc-500" />
                    Start: {format(new Date(task.start_date || task.createdAt), "dd MMM yyyy")}
                </div>
                <div className="flex items-center gap-2">
                    <CalendarIcon className="size-4 text-gray-500 dark:text-zinc-500" />
                    Due: {format(new Date(task.due_date), "dd MMM yyyy")}
                </div>
            </div>
        </div>
    );
}
