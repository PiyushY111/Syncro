import { useState } from 'react';
import { Mail, ArrowRight, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/configs/api';

export default function ForgotPasswordForm({ onBackToLogin }) {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) {
            toast.error('Please enter your email address');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/api/auth/forgot-password', { email: email.trim().toLowerCase() });
            setIsSubmitted(true);
            toast.success('Password recovery instructions sent!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send recovery email. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="text-left space-y-4">
                <div className="mb-4">
                    <img src="/Logos/Syncro(Light).png" alt="Syncro Logo" className="h-8 w-auto object-contain" />
                </div>

                <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 p-5 text-center">
                    <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 mb-3">
                        <CheckCircle2 className="size-6" strokeWidth={2.4} />
                    </div>
                    <h3 className="text-lg font-semibold text-emerald-950 dark:text-emerald-200">Check your inbox</h3>
                    <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                        If an account exists for <span className="font-semibold">{email}</span>, a secure password reset link has been dispatched with a 15-minute validity.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onBackToLogin}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 hover:bg-slate-200 py-3 text-sm font-semibold text-slate-800 transition cursor-pointer"
                >
                    <ArrowLeft className="size-4" /> Back to Sign in
                </button>
            </div>
        );
    }

    return (
        <div className="text-left">
            <div className="mb-4">
                <img src="/Logos/Syncro(Light).png" alt="Syncro Logo" className="h-8 w-auto object-contain" />
            </div>

            <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-blue-600">Account Recovery</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-950">Reset your password</h2>
                </div>
                <div className="rounded-2xl bg-slate-100 p-3 text-blue-600">
                    <KeyRound className="size-5" />
                </div>
            </div>

            <p className="mb-6 text-xs text-slate-500 leading-relaxed">
                Enter your registered email address and we'll generate a single-use cryptographically signed reset token.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Email Address</label>
                    <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 text-slate-900"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                >
                    {isSubmitting ? 'Sending instructions...' : 'Send Reset Link'}
                    <ArrowRight className="size-4" />
                </button>

                <button
                    type="button"
                    onClick={onBackToLogin}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition cursor-pointer"
                >
                    <ArrowLeft className="size-4" /> Back to Sign in
                </button>
            </form>
        </div>
    );
}
