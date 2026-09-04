import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Lock, KeyRound, CheckCircle2, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/configs/api';

export default function ResetPassword() {
    const location = useLocation();
    const navigate = useNavigate();
    const urlToken = new URLSearchParams(location.search).get('token') || '';

    const [token, setToken] = useState(urlToken);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Password strength evaluation
    const hasMinLength = newPassword.length >= 8;
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
    const isComplexityMet = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecial;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token.trim()) {
            toast.error('Recovery token is missing. Please check your reset link or enter the token.');
            return;
        }

        if (!isComplexityMet) {
            toast.error('Password does not meet NIST complexity standards.');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match.');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/api/auth/reset-password', {
                token: token.trim(),
                newPassword
            });
            setIsSuccess(true);
            toast.success('Password successfully reset!');
            setTimeout(() => {
                navigate('/auth');
            }, 2500);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reset password. The link may have expired.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="syncro-auth min-h-screen overflow-hidden bg-[#07111f] text-white flex items-center justify-center px-4 py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.35),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.25),_transparent_30%)]" />

            <div className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-white/95 p-6 sm:p-8 text-slate-900 shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur">
                <div className="mb-4">
                    <img src="/Logos/Syncro(Light).png" alt="Syncro Logo" className="h-8 w-auto object-contain" />
                </div>

                {isSuccess ? (
                    <div className="text-center py-6 space-y-4">
                        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-500">
                            <CheckCircle2 className="size-9" strokeWidth={2.4} />
                        </div>
                        <h2 className="text-2xl font-semibold text-slate-950">Password Changed</h2>
                        <p className="text-sm text-slate-600">
                            Your password has been updated and all other active sessions have been safely invalidated. Redirecting you to sign in...
                        </p>
                        <Link
                            to="/auth"
                            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 cursor-pointer"
                        >
                            Sign In Now <ArrowRight className="size-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="text-left">
                        <div className="mb-6 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm uppercase tracking-[0.2em] text-blue-600">Set New Password</p>
                                <h2 className="mt-1 text-2xl font-semibold text-slate-950">Secure your account</h2>
                            </div>
                            <div className="rounded-2xl bg-slate-100 p-3 text-blue-600">
                                <KeyRound className="size-5" />
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!urlToken && (
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">Reset Token</label>
                                    <input
                                        type="text"
                                        value={token}
                                        onChange={(e) => setToken(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm outline-none transition focus:border-blue-500 text-slate-900 font-mono"
                                        placeholder="Paste your 64-character token"
                                        required
                                    />
                                </div>
                            )}

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">New Password</label>
                                <div className="relative">
                                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-blue-500 text-slate-900"
                                        placeholder="Enter new strong password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 text-slate-900"
                                        placeholder="Confirm new password"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password requirements indicators */}
                            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 space-y-1.5 text-xs">
                                <p className="font-semibold text-slate-600 flex items-center gap-1.5 mb-2">
                                    <ShieldCheck className="size-3.5 text-blue-600" /> NIST Password Requirements:
                                </p>
                                <div className="grid grid-cols-2 gap-1 text-[11px]">
                                    <span className={hasMinLength ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                                        {hasMinLength ? '✓' : '○'} Min 8 characters
                                    </span>
                                    <span className={hasUpperCase ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                                        {hasUpperCase ? '✓' : '○'} Uppercase letter
                                    </span>
                                    <span className={hasLowerCase ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                                        {hasLowerCase ? '✓' : '○'} Lowercase letter
                                    </span>
                                    <span className={hasNumber ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                                        {hasNumber ? '✓' : '○'} One number
                                    </span>
                                    <span className={hasSpecial ? 'text-emerald-600 font-medium col-span-2' : 'text-slate-400 col-span-2'}>
                                        {hasSpecial ? '✓' : '○'} Special character (!@#$%^&*)
                                    </span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || !isComplexityMet || newPassword !== confirmPassword}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                            >
                                {isSubmitting ? 'Updating password...' : 'Reset Password & Sign In'}
                                <ArrowRight className="size-4" />
                            </button>

                            <div className="text-center pt-2">
                                <Link to="/auth" className="text-xs font-medium text-slate-500 hover:text-blue-600 transition">
                                    Back to Sign In
                                </Link>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
