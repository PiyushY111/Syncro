import { Flag, Calendar, CheckCircle2, AlertCircle, Clock, Trash2, Edit3, Link2 } from 'lucide-react';

export default function MilestoneCard({ milestone, onEdit, onDelete, onLinkTasks }) {
    const { title, description, dueDate, status, health, progress, completedTasks, totalTasks, color } = milestone;

    const healthColors = {
        ON_TRACK: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        AT_RISK: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        OFF_TRACK: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
    };

    const statusBadges = {
        PLANNED: 'bg-brand/10 text-brand dark:text-violet-300',
        IN_PROGRESS: 'bg-brand/10 text-brand dark:text-violet-300',
        ACHIEVED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        MISSED: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
        CANCELLED: 'bg-zinc-500/10 text-zinc-500'
    };

    return (
        <div className="sx-glass p-5 rounded-2xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4">
            <div>
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15`, color }}>
                            <Flag className="size-4" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">{title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${healthColors[health] || healthColors.ON_TRACK}`}>
                                    {health.replace('_', ' ')}
                                </span>
                                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusBadges[status] || statusBadges.PLANNED}`}>
                                    {status}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-zinc-400">
                        <button onClick={() => onLinkTasks(milestone)} className="p-1.5 hover:bg-slate-500/10 dark:hover:bg-white/[0.07] rounded-md transition cursor-pointer" title="Link Tasks">
                            <Link2 className="size-3.5" />
                        </button>
                        <button onClick={() => onEdit(milestone)} className="p-1.5 hover:bg-slate-500/10 dark:hover:bg-white/[0.07] rounded-md transition cursor-pointer" title="Edit">
                            <Edit3 className="size-3.5" />
                        </button>
                        <button onClick={() => onDelete(milestone.id)} className="p-1.5 hover:bg-rose-500/10 hover:text-rose-500 rounded-md transition cursor-pointer" title="Delete">
                            <Trash2 className="size-3.5" />
                        </button>
                    </div>
                </div>

                {description && <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{description}</p>}
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-900/[0.05] dark:border-white/[0.07]">
                <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                    <span className="flex items-center gap-1">
                        <Calendar className="size-3 text-zinc-400" />
                        {new Date(dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="font-medium">{progress}%</span>
                </div>
                <div className="w-full bg-slate-500/[0.08] dark:bg-white/[0.06] h-2 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: color }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>{completedTasks} of {totalTasks} tasks done</span>
                </div>
            </div>
        </div>
    );
}
