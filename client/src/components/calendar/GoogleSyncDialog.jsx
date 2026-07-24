import { useState } from 'react';
import { X, Sparkles, Check, Chrome, Loader2, LogOut, Video, ShieldCheck, AlertTriangle } from 'lucide-react';
import api from '@/configs/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

export default function GoogleSyncDialog({
    isOpen,
    onClose,
    onSyncStatusChanged
}) {
    const { user, updateUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [notConfigured, setNotConfigured] = useState(false);

    const googleSyncEnabled = user?.googleCalendarSync || false;
    const googleSyncEmail = user?.googleCalendarEmail || '';

    if (!isOpen) return null;

    // Direct Google OAuth Redirect
    const handleContinueWithGoogle = async () => {
        setIsLoading(true);
        setNotConfigured(false);
        try {
            const { data } = await api.get('/api/google-calendar/auth-url');
            if (data?.configured && data?.url) {
                // Redirect directly to Google's real OAuth Authorization screen
                window.location.href = data.url;
                return;
            }

            if (!data?.configured) {
                setNotConfigured(true);
                toast.error('Please configure your GOOGLE_CLIENT_ID in server/.env');
            }
        } catch (error) {
            console.error('Error initiating Google OAuth:', error);
            toast.error('Failed to initiate Google OAuth login');
        } finally {
            setIsLoading(false);
        }
    };

    // Disconnect Sync
    const handleDisconnectSync = async () => {
        setIsLoading(true);
        try {
            const { data } = await api.post('/api/google-calendar/disconnect');
            updateUser(data.user);
            toast.success('Google Calendar disconnected.');
            
            if (onSyncStatusChanged) {
                onSyncStatusChanged(false, '');
            }
            onClose();
        } catch (error) {
            console.error('Error disconnecting sync:', error);
            toast.error('Failed to disconnect sync');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative text-left">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                    <X className="size-5" />
                </button>

                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-lg">
                        <Sparkles className="size-5" />
                    </div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Google Calendar Integration</h2>
                </div>

                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                    Connect Google Calendar (`calendar.google.com`) via Google OAuth 2.0 to automatically push meetings, create Google Meet links, and email invitation updates.
                </p>

                {notConfigured && (
                    <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-400">
                        <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold">Google Cloud Credentials Required</span>
                            <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-500">
                                Set <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded font-mono">GOOGLE_CLIENT_ID</code> & <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded font-mono">GOOGLE_CLIENT_SECRET</code> in <code className="font-bold">server/.env</code> to proceed with Google Cloud authentication.
                            </p>
                        </div>
                    </div>
                )}

                {googleSyncEnabled ? (
                    /* Connected State */
                    <div className="space-y-4">
                        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl p-4 flex items-start gap-3">
                            <div className="p-1 bg-emerald-500 text-white rounded-full mt-0.5">
                                <Check className="size-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">
                                    Google Calendar Active
                                </h4>
                                <p className="text-xs text-emerald-700 dark:text-emerald-500 truncate">
                                    Connected as {googleSyncEmail}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
                            <div className="flex items-center gap-2">
                                <Video className="size-3.5 text-blue-500 shrink-0" />
                                <span>Automatic Google Meet video link generation</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="size-3.5 text-emerald-500 shrink-0" />
                                <span>Email invitations sent via Google (`sendUpdates="all"`)</span>
                            </div>
                        </div>

                        <div className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 justify-center py-1">
                            <Loader2 className="size-3.5 animate-spin text-amber-500" />
                            2-Way Sync Active
                        </div>

                        <button
                            onClick={handleDisconnectSync}
                            disabled={isLoading}
                            className="w-full py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            {isLoading ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <>
                                    <LogOut className="size-4" />
                                    Disconnect Google Account
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    /* Disconnected State - Pure Google OAuth Redirect */
                    <div className="space-y-4">
                        <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center">
                            <Chrome className="size-8 mx-auto text-zinc-300 dark:text-zinc-700 mb-2" />
                            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                No Google Account Connected
                            </span>
                        </div>

                        <button
                            onClick={handleContinueWithGoogle}
                            disabled={isLoading}
                            className="w-full py-3 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 font-semibold text-sm transition flex items-center justify-center gap-3 shadow-sm hover:shadow cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900"
                        >
                            <svg className="size-5" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                />
                            </svg>
                            {isLoading ? 'Connecting...' : 'Continue with Google'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
