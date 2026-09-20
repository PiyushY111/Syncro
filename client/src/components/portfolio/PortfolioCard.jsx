import { FolderKanban, ArrowRight, Activity, Layers, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PortfolioCard({ portfolio, onDelete }) {
    const navigate = useNavigate();

    const { id, name, description, color, projectCount, avgProgress, health } = portfolio;

    const healthBadge = {
        ON_TRACK: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        AT_RISK: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        OFF_TRACK: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
    };

    return (
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4">
            <div>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${color}15`, color }}>
                            <FolderKanban className="size-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">{name}</h3>
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${healthBadge[health] || healthBadge.ON_TRACK}`}>
                                {health.replace('_', ' ')}
                            </span>
                        </div>
                    </div>
                    <button onClick={() => onDelete(id)} className="text-zinc-400 hover:text-rose-500 p-1.5 rounded-md transition cursor-pointer" title="Delete Portfolio">
                        <Trash2 className="size-3.5" />
                    </button>
                </div>

                {description && <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{description}</p>}
            </div>

            <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 flex items-center gap-2">
                        <Layers className="size-3.5 text-indigo-500" />
                        <div>
                            <p className="text-[10px] text-zinc-400">Projects</p>
                            <p className="font-semibold text-zinc-800 dark:text-zinc-200">{projectCount || 0}</p>
                        </div>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 flex items-center gap-2">
                        <Activity className="size-3.5 text-blue-500" />
                        <div>
                            <p className="text-[10px] text-zinc-400">Progress</p>
                            <p className="font-semibold text-zinc-800 dark:text-zinc-200">{avgProgress || 0}%</p>
                        </div>
                    </div>
                </div>

                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${avgProgress || 0}%`, backgroundColor: color }} />
                </div>

                <button
                    onClick={() => navigate(`/portfoliosDetail?id=${id}`)}
                    className="w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition cursor-pointer"
                >
                    View Portfolio Details
                    <ArrowRight className="size-3.5" />
                </button>
            </div>
        </div>
    );
}
