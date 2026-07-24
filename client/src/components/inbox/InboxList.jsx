import InboxItemCard from './InboxItemCard';
import { Inbox as InboxIcon } from 'lucide-react';

export default function InboxList({ notifications, onMarkRead, onArchive, onAction }) {
    if (!notifications || notifications.length === 0) {
        return (
            <div className="p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/40 dark:bg-zinc-900/20">
                <div className="mx-auto size-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
                    <InboxIcon className="size-6" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">Your inbox is clear!</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                    No pending notifications or assigned tasks right now. Check back as team members assign work or invite you to meetings.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {notifications.map((item) => (
                <InboxItemCard
                    key={item.id}
                    item={item}
                    onMarkRead={onMarkRead}
                    onArchive={onArchive}
                    onAction={onAction}
                />
            ))}
        </div>
    );
}
