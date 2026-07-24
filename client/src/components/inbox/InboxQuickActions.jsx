import { CheckCircle2, Archive, ExternalLink, CalendarCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function InboxQuickActions({ item, onMarkRead, onArchive, onAction }) {
    const navigate = useNavigate();

    const handleJump = () => {
        if (item.entityType === 'TASK' && item.entityId) {
            navigate(`/taskDetails?id=${item.entityId}`);
        } else if (item.entityType === 'CHAT') {
            navigate('/chat');
        } else if (item.entityType === 'MEETING') {
            navigate('/calendar');
        }
    };

    return (
        <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
            {item.entityType === 'MEETING' && (
                <button
                    onClick={() => onAction('RESPOND_INVITE', item.entityType, item.entityId, 'ACCEPTED')}
                    className="px-2.5 py-1 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-md transition flex items-center gap-1 cursor-pointer"
                >
                    <CalendarCheck className="size-3" /> Accept
                </button>
            )}

            {item.entityType === 'TASK' && (
                <button
                    onClick={() => onAction('COMPLETE_TASK', item.entityType, item.entityId, 'DONE')}
                    className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 rounded-md transition flex items-center gap-1 cursor-pointer"
                >
                    <CheckCircle2 className="size-3" /> Complete Task
                </button>
            )}

            {item.entityId && (
                <button
                    onClick={handleJump}
                    className="px-2.5 py-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition flex items-center gap-1 cursor-pointer"
                >
                    <ExternalLink className="size-3" /> View Source
                </button>
            )}

            <div className="ml-auto flex items-center gap-1 text-zinc-400">
                <button
                    onClick={() => onMarkRead(item.id)}
                    className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition cursor-pointer text-xs"
                    title={item.isRead ? "Mark as unread" : "Mark as read"}
                >
                    <CheckCircle2 className={`size-3.5 ${item.isRead ? 'text-blue-500' : ''}`} />
                </button>
                <button
                    onClick={() => onArchive(item.id)}
                    className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition cursor-pointer text-xs"
                    title="Archive"
                >
                    <Archive className="size-3.5" />
                </button>
            </div>
        </div>
    );
}
