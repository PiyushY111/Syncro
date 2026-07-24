import MilestoneCard from './MilestoneCard';
import { Flag } from 'lucide-react';

export default function MilestoneList({ milestones, onEdit, onDelete, onLinkTasks }) {
    if (!milestones || milestones.length === 0) {
        return (
            <div className="p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/40 dark:bg-zinc-900/20">
                <div className="mx-auto size-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
                    <Flag className="size-6" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">No milestones found</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                    Set strategic project goals, release checkpoints, or MVP launch targets to keep your team aligned.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {milestones.map((m) => (
                <MilestoneCard
                    key={m.id}
                    milestone={m}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onLinkTasks={onLinkTasks}
                />
            ))}
        </div>
    );
}
