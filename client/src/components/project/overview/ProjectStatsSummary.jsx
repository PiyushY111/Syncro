import { ZapIcon } from 'lucide-react';

export default function ProjectStatsSummary({ tasks, project }) {
    const cards = [
        { label: "Total Tasks", value: tasks.length, color: "text-zinc-900 dark:text-white" },
        { label: "Completed", value: tasks.filter((t) => t.status === "DONE").length, color: "text-emerald-700 dark:text-emerald-400" },
        { label: "In Progress", value: tasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "TODO").length, color: "text-amber-700 dark:text-amber-400" },
        { label: "Team Members", value: project?.members?.length || 0, color: "text-blue-700 dark:text-blue-400" },
    ];

    return (
        <div className="grid grid-cols-2 sm:flex flex-wrap gap-6 text-left">
            {cards.map((card, idx) => (
                <div key={idx} className="dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 flex justify-between sm:min-w-60 p-4 py-2.5 rounded">
                    <div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">{card.label}</div>
                        <div className={`text-2xl font-bold ${card.color} mt-1`}>{card.value}</div>
                    </div>
                    <ZapIcon className={`size-4 ${card.color}`} />
                </div>
            ))}
        </div>
    );
}
