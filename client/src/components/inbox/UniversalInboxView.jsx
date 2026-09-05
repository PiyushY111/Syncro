import { useState, useEffect } from 'react';
import api from '@/configs/api';
import toast from 'react-hot-toast';
import InboxHeader from './InboxHeader';
import InboxList from './InboxList';

export default function UniversalInboxView() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [filter, setFilter] = useState('ALL');
    const [search, setSearch] = useState('');

    const fetchInbox = async () => {
        try {
            const res = await api.get(`/api/inbox?filter=${filter}&search=${encodeURIComponent(search)}`);
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unreadCount || 0);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchInbox();
    }, [filter, search]);

    const handleMarkRead = async (id) => {
        // Optimistic UI update (0ms)
        setNotifications((prev) => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount((prev) => Math.max(0, prev - 1));

        try {
            await api.patch(`/api/inbox/${id}/read`);
        } catch (err) {
            toast.error('Failed to mark read');
            fetchInbox();
        }
    };

    const handleMarkAllRead = async () => {
        // Optimistic UI update (0ms)
        setNotifications((prev) => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success('All notifications marked as read');

        try {
            await api.patch('/api/inbox/read-all');
        } catch (err) {
            toast.error('Failed to mark all read');
            fetchInbox();
        }
    };

    const handleArchive = async (id) => {
        // Optimistic UI update (0ms)
        const target = notifications.find(n => n.id === id);
        setNotifications((prev) => prev.filter(n => n.id !== id));
        if (target && !target.isRead) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        toast.success('Archived');

        try {
            await api.patch(`/api/inbox/${id}/archive`);
        } catch (err) {
            toast.error('Failed to archive');
            fetchInbox();
        }
    };

    const handleAction = async (actionType, entityType, entityId, status) => {
        try {
            const res = await api.post('/api/inbox/action', { actionType, entityType, entityId, status });
            toast.success(res.data.message || 'Action executed');
            fetchInbox();
        } catch (err) {
            toast.error('Action failed');
        }
    };

    return (
        <div className="space-y-4 max-w-4xl mx-auto">
            <InboxHeader
                filter={filter}
                setFilter={setFilter}
                search={search}
                setSearch={setSearch}
                unreadCount={unreadCount}
                onMarkAllRead={handleMarkAllRead}
            />
            <InboxList
                notifications={notifications}
                onMarkRead={handleMarkRead}
                onArchive={handleArchive}
                onAction={handleAction}
            />
        </div>
    );
}
