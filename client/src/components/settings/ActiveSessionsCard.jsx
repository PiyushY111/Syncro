import { useState, useEffect } from 'react';
import { Laptop, Smartphone, Tablet, Monitor, Shield, LogOut, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/configs/api';

const parseDevice = (ua = '') => {
    const lower = ua.toLowerCase();
    if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) {
        return { type: 'mobile', icon: Smartphone, label: 'Mobile Device' };
    }
    if (lower.includes('ipad') || lower.includes('tablet')) {
        return { type: 'tablet', icon: Tablet, label: 'Tablet' };
    }
    if (lower.includes('macintosh') || lower.includes('mac os')) {
        return { type: 'desktop', icon: Laptop, label: 'macOS Device' };
    }
    if (lower.includes('windows')) {
        return { type: 'desktop', icon: Monitor, label: 'Windows PC' };
    }
    if (lower.includes('linux')) {
        return { type: 'desktop', icon: Monitor, label: 'Linux Device' };
    }
    return { type: 'desktop', icon: Laptop, label: 'Desktop Device' };
};

const parseBrowser = (ua = '') => {
    if (!ua) return 'Web Browser';
    if (ua.includes('Edg/')) return 'Microsoft Edge';
    if (ua.includes('Chrome/')) return 'Google Chrome';
    if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Apple Safari';
    if (ua.includes('Firefox/')) return 'Mozilla Firefox';
    return 'Web Browser';
};

const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Active just now';
    if (diffSec < 3600) return `Active ${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `Active ${Math.floor(diffSec / 3600)}h ago`;
    return `Active on ${date.toLocaleDateString()}`;
};

export default function ActiveSessionsCard() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [revokingId, setRevokingId] = useState(null);
    const [revokingOthers, setRevokingOthers] = useState(false);

    const loadSessions = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/api/auth/sessions');
            setSessions(data?.sessions || []);
        } catch (error) {
            console.error('Failed to load active sessions:', error);
            toast.error(error.response?.data?.message || 'Failed to load connected devices');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSessions();
    }, []);

    const handleRevokeSession = async (sessionId) => {
        setRevokingId(sessionId);
        try {
            await api.post(`/api/auth/sessions/${sessionId}/revoke`);
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            toast.success('Session terminated successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to terminate session');
        } finally {
            setRevokingId(null);
        }
    };

    const handleRevokeOthers = async () => {
        setRevokingOthers(true);
        try {
            const { data } = await api.post('/api/auth/sessions/revoke-others');
            toast.success(data?.message || 'All other sessions have been logged out');
            await loadSessions();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to revoke other sessions');
        } finally {
            setRevokingOthers(false);
        }
    };

    const otherSessionsCount = sessions.filter(s => !s.isCurrent).length;

    return (
        <div className="space-y-6 pt-8 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                        <Shield size={18} className="text-blue-500" />
                        Connected Devices & Active Sessions
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">
                        View and manage active browser logins authenticated to your Syncro account.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={loadSessions}
                        disabled={loading}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                        title="Refresh sessions"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    </button>

                    {otherSessionsCount > 0 && (
                        <button
                            type="button"
                            onClick={handleRevokeOthers}
                            disabled={revokingOthers}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition cursor-pointer disabled:opacity-50"
                        >
                            <LogOut size={13} />
                            {revokingOthers ? 'Revoking...' : `Sign out ${otherSessionsCount} other device${otherSessionsCount > 1 ? 's' : ''}`}
                        </button>
                    )}
                </div>
            </div>

            {loading && sessions.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-500 dark:text-zinc-500">
                    Loading authenticated sessions...
                </div>
            ) : sessions.length === 0 ? (
                <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-6 text-center text-xs text-gray-500 dark:text-zinc-400">
                    No active remote sessions recorded.
                </div>
            ) : (
                <div className="space-y-3">
                    {sessions.map((session) => {
                        const device = parseDevice(session.userAgent);
                        const browser = parseBrowser(session.userAgent);
                        const DeviceIcon = device.icon;

                        return (
                            <div
                                key={session.id}
                                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition ${
                                    session.isCurrent
                                        ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50'
                                        : 'bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700'
                                } gap-4`}
                            >
                                <div className="flex items-start gap-3.5">
                                    <div className={`p-2.5 rounded-xl ${
                                        session.isCurrent
                                            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'
                                    }`}>
                                        <DeviceIcon size={20} />
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {browser} on {device.label}
                                            </span>
                                            {session.isCurrent && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                                    Current Device
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-zinc-400 flex-wrap">
                                            <span>IP: <span className="font-mono">{session.ipAddress || '127.0.0.1'}</span></span>
                                            <span>•</span>
                                            <span>{formatRelativeTime(session.lastActiveAt)}</span>
                                        </div>
                                    </div>
                                </div>

                                {!session.isCurrent && (
                                    <div className="flex items-center sm:self-center">
                                        <button
                                            type="button"
                                            onClick={() => handleRevokeSession(session.id)}
                                            disabled={revokingId === session.id}
                                            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer disabled:opacity-50"
                                        >
                                            {revokingId === session.id ? 'Revoking...' : 'Sign out'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
