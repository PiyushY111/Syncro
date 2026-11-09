import { CheckSquare, MessageSquare, Calendar, AlertCircle, Bell } from 'lucide-react';
import InboxQuickActions from './InboxQuickActions';

export default function InboxItemCard({ item, onMarkRead, onArchive, onAction }) {
    const { title, content, type, priority, isRead, createdAt } = item;

    const typeIcons = {
        TASK_ASSIGNED: { icon: CheckSquare, color: 'text-brand dark:text-violet-300 bg-brand/10' },
        TASK_DUE: { icon: AlertCircle, color: 'text-amber-500 bg-amber-500/10' },
        COMMENT_MENTION: { icon: MessageSquare, color: 'text-brand dark:text-violet-300 bg-brand/10' },
        CHAT_MESSAGE: { icon: MessageSquare, color: 'text-emerald-500 bg-emerald-500/10' },
        MEETING_INVITE: { icon: Calendar, color: 'text-brand dark:text-violet-300 bg-brand/10' },
        MILESTONE_ALERT: { icon: Bell, color: 'text-rose-500 bg-rose-500/10' },
        SYSTEM: { icon: Bell, color: 'text-zinc-500 bg-zinc-500/10' }
    };

    const priorityBadge = {
        HIGH: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        MEDIUM: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        LOW: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
    };

    const iconConfig = typeIcons[type] || typeIcons.SYSTEM;
    const IconComponent = iconConfig.icon;

    const formattedTime = createdAt
        ? new Date(createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'Just now';

    return (
        <div className={`p-4 rounded-xl border transition-all space-y-3 ${isRead ? 'bg-white/40 dark:bg-white/[0.03] border-slate-900/[0.07] dark:border-white/[0.07] opacity-85' : 'bg-white dark:bg-white/[0.03] border-slate-900/10 dark:border-white/10 shadow-xs'}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0 ${iconConfig.color}`}>
                        <IconComponent className="size-4" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{title}</h4>
                            {!isRead && <span className="size-2 rounded-full bg-brand shrink-0" />}
                        </div>
                        {content && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">{content}</p>}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[10px] text-zinc-400">{formattedTime}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${priorityBadge[priority] || priorityBadge.LOW}`}>
                        {priority}
                    </span>
                </div>
            </div>

            <InboxQuickActions
                item={item}
                onMarkRead={onMarkRead}
                onArchive={onArchive}
                onAction={onAction}
            />
        </div>
    );
}
