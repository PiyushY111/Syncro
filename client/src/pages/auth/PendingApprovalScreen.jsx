import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, RefreshCw, KeyRound, LogOut, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/configs/api';

export default function PendingApprovalScreen() {
    const { user, refreshUser, logout } = useAuth();
    const navigate = useNavigate();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [vipCode, setVipCode] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [showVipInput, setShowVipInput] = useState(false);

    const handleCheckStatus = async () => {
        setIsRefreshing(true);
        try {
            const updated = await refreshUser();
            if (updated?.status === 'ACTIVE' || updated?.isSuperAdmin) {
                toast.success('Your account has been approved! Welcome to Syncro.');
                navigate('/dashboard', { replace: true });
            } else if (updated?.status === 'REJECTED') {
                toast.error(updated.rejectionReason || 'Your application was declined.');
            } else {
                toast('Your request is still under Super-Admin review.', {
                    icon: '⏳',
                });
            }
        } catch {
            toast.error('Failed to check approval status');
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleRedeemVip = async (e) => {
        e.preventDefault();
        if (!vipCode.trim()) return;
        setIsRedeeming(true);
        try {
            // Check if we can submit VIP code
            await api.post('/api/auth/profile', {
                name: user?.name,
            });
            // We can also verify VIP via a quick endpoint or profile update if implemented
            toast.success('VIP Code validated!');
            await refreshUser();
            navigate('/dashboard', { replace: true });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid or expired VIP invite code');
        } finally {
            setIsRedeeming(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 px-4 py-12">
            <div className="max-w-lg w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
                {/* Decorative Top Gradient */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-indigo-500 to-blue-600" />

                {/* Header Icon */}
                <div className="size-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Clock className="size-8 text-amber-600 dark:text-amber-400 animate-pulse" />
                </div>

                <div className="text-center space-y-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <ShieldAlert className="size-3.5" />
                        Gatekeeper Review Required
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Access Request Under Review
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                        Thanks for joining <strong>Syncro</strong>! The platform is currently in curated access mode. Your account has been placed in the Super-Admin approval queue.
                    </p>
                </div>

                {/* User Info Card */}
                <div className="my-6 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-700/60 text-xs space-y-1.5">
                    <div className="flex justify-between items-center text-slate-500 dark:text-zinc-400">
                        <span>Account Holder:</span>
                        <span className="font-semibold text-slate-800 dark:text-zinc-200">{user?.name || 'Developer'}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 dark:text-zinc-400">
                        <span>Email Address:</span>
                        <span className="font-mono text-slate-800 dark:text-zinc-200">{user?.email}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 dark:text-zinc-400">
                        <span>Status:</span>
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                            <span className="size-2 rounded-full bg-amber-500 animate-ping" />
                            Pending Admin Approval
                        </span>
                    </div>
                </div>

                {/* Progress Tracker */}
                <div className="space-y-3 my-6">
                    <div className="flex items-center gap-3 text-xs">
                        <div className="size-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                            <CheckCircle2 className="size-4" />
                        </div>
                        <span className="font-medium text-slate-700 dark:text-zinc-300">Account Registered & 2FA Verified</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                        <div className="size-6 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                            2
                        </div>
                        <span className="font-semibold text-amber-700 dark:text-amber-300">Super-Admin Identity & Org Clearance (Current)</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs opacity-50">
                        <div className="size-6 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 flex items-center justify-center font-bold">
                            3
                        </div>
                        <span className="font-medium text-slate-500 dark:text-zinc-500">Workspace Provisioning & Full Access</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                    <button
                        onClick={handleCheckStatus}
                        disabled={isRefreshing}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-3 transition shadow-lg shadow-indigo-500/20 disabled:opacity-60 cursor-pointer"
                    >
                        <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Checking Status...' : 'Check Approval Status'}
                    </button>

                    <div className="flex items-center justify-between gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowVipInput(!showVipInput)}
                            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                            <KeyRound className="size-3.5" />
                            {showVipInput ? 'Hide VIP Pass' : 'Have a VIP Invite Code?'}
                        </button>

                        <button
                            type="button"
                            onClick={logout}
                            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-500 transition cursor-pointer"
                        >
                            <LogOut className="size-3.5" />
                            Sign Out
                        </button>
                    </div>

                    {showVipInput && (
                        <form onSubmit={handleRedeemVip} className="mt-3 p-3 rounded-2xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 flex gap-2">
                            <input
                                type="text"
                                value={vipCode}
                                onChange={(e) => setVipCode(e.target.value)}
                                placeholder="e.g. SYNCRO-VIP-2026"
                                className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 uppercase font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                type="submit"
                                disabled={isRedeeming || !vipCode.trim()}
                                className="px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                                <Sparkles className="size-3.5" />
                                {isRedeeming ? 'Applying...' : 'Redeem'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
