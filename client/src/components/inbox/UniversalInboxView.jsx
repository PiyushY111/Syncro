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
        try {
            await api.patch(`/api/inbox/${id}/read`);
            fetchInbox();
        } catch (err) {
            toast.error('Failed to mark read');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.patch('/api/inbox/read-all');
            toast.success('All notifications marked as read');
            fetchInbox();
        } catch (err) {
            toast.error('Failed to mark all read');
        }
    };

    const handleArchive = async (id) => {
        try {
            await api.patch(`/api/inbox/${id}/archive`);
            toast.success('Archived');
            fetchInbox();
        } catch (err) {
            toast.error('Failed to archive');
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
