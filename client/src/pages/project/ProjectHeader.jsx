import { ArrowLeftIcon, PlusIcon } from 'lucide-react';

const statusColors = {
    PLANNING: "bg-zinc-200 text-zinc-900 dark:bg-zinc-600 dark:text-zinc-200",
    ACTIVE: "bg-emerald-200 text-emerald-900 dark:bg-emerald-500 dark:text-emerald-900",
    ON_HOLD: "bg-amber-200 text-amber-900 dark:bg-amber-500 dark:text-amber-900",
    COMPLETED: "bg-blue-200 text-blue-900 dark:bg-blue-500 dark:text-blue-900",
    CANCELLED: "bg-red-200 text-red-900 dark:bg-red-500 dark:text-red-900",
};

export default function ProjectHeader({ project, navigate, setShowCreateTask }) {
    return (
        <div className="flex max-md:flex-col gap-4 flex-wrap items-start justify-between max-w-6xl text-left">
            <div className="flex items-center gap-4">
                <button className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 cursor-pointer" onClick={() => navigate('/projects')}>
                    <ArrowLeftIcon className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-medium">{project.name}</h1>
                    <span className={`px-2 py-1 rounded text-xs capitalize ${statusColors[project.status]} font-semibold`}>
                        {project.status.replace("_", " ").toLowerCase()}
                    </span>
                </div>
            </div>
            <button onClick={() => setShowCreateTask(true)} className="flex items-center gap-2 px-5 py-2 text-sm rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white cursor-pointer font-medium">
                <PlusIcon className="size-4" />
                New Task
            </button>
        </div>
    );
}
