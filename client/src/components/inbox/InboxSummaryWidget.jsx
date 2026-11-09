import { Inbox, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function InboxSummaryWidget({ unreadCount, recentNotifications }) {
    const navigate = useNavigate();

    return (
        <div className="sx-glass p-5 rounded-2xl flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-brand/10 text-brand dark:text-violet-300">
                        <Inbox className="size-4" />
                    </div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">Universal Inbox</h3>
                </div>
                {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-brand text-white">
                        {unreadCount} UNREAD
                    </span>
                )}
            </div>

            <div className="space-y-2">
                {!recentNotifications || recentNotifications.length === 0 ? (
                    <p className="text-xs text-zinc-400 py-2">Inbox is empty</p>
                ) : (
                    recentNotifications.slice(0, 3).map((item) => (
                        <div key={item.id} className="p-2 rounded-lg bg-slate-500/[0.05] dark:bg-white/[0.06] text-xs flex items-center justify-between">
                            <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[200px]">{item.title}</span>
                            <span className="text-[10px] text-zinc-400 shrink-0">{item.priority}</span>
                        </div>
                    ))
                )}
            </div>

            <button
                onClick={() => navigate('/inbox')}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 bg-slate-500/[0.08] hover:bg-zinc-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.07] text-zinc-800 dark:text-zinc-200 transition cursor-pointer"
            >
                Open Inbox
                <ArrowRight className="size-3.5" />
            </button>
        </div>
    );
}
