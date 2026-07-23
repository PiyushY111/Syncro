import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, ShieldCheck, Users, ArrowRight, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const features = [
    'Protected workspaces with invite-based collaboration',
    'Projects, tasks, analytics, and activity in one place',
    'A clean responsive UI built for teams that move fast',
];

const AuthPage = () => {
    const { user, login, register, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const nextPath = new URLSearchParams(location.search).get('next') || '/';
    const [mode, setMode] = useState('login');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });

    useEffect(() => {
        if (!loading && user) {
            navigate(nextPath, { replace: true });
        }
    }, [loading, user, navigate, nextPath]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);

        try {
            if (mode === 'login') {
                await login({ email: formData.email, password: formData.password });
                toast.success('Welcome back');
            } else {
                await register({ name: formData.name, email: formData.email, password: formData.password });
                toast.success('Account created');
            }

            navigate(nextPath, { replace: true });
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen overflow-hidden bg-[#07111f] text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.35),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.25),_transparent_30%)]" />
            <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.15fr_0.85fr]">
                <section className="flex flex-col justify-center px-6 py-14 sm:px-10 lg:px-16 xl:px-24">
                    <div className="max-w-xl">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-blue-100 backdrop-blur">
                            <Sparkles className="size-4 text-cyan-300" />
                            Project workspace management
                        </div>
                        <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl xl:text-6xl">
                            Manage work that feels organized, even when the team is not.
                        </h1>
                        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                            Sign in or create an account with email and password. Then create workspaces, invite teammates, and track projects without a third-party auth wall.
                        </p>

                        <div className="mt-8 grid gap-4 sm:grid-cols-3">
                            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                                <ShieldCheck className="size-5 text-cyan-300" />
                                <p className="mt-3 text-sm font-medium text-white">Secure access</p>
                            </div>
                            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                                <Users className="size-5 text-cyan-300" />
                                <p className="mt-3 text-sm font-medium text-white">Team collaboration</p>
                            </div>
                            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                                <ArrowRight className="size-5 text-cyan-300" />
                                <p className="mt-3 text-sm font-medium text-white">Fast onboarding</p>
                            </div>
                        </div>

                        <ul className="mt-8 space-y-3 text-sm text-slate-300">
                            {features.map((feature) => (
                                <li key={feature} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-300" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
                    <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/95 p-6 text-slate-900 shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur xl:p-8">
                        <div className="mb-6 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm uppercase tracking-[0.2em] text-blue-600">{mode === 'login' ? 'Welcome back' : 'Create account'}</p>
                                <h2 className="mt-1 text-2xl font-semibold text-slate-950">{mode === 'login' ? 'Sign in to continue' : 'Start your workspace'}</h2>
                            </div>
                            <div className="rounded-2xl bg-slate-100 p-3 text-blue-600">
                                <Lock className="size-5" />
                            </div>
                        </div>

                        <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
                            <button type="button" onClick={() => setMode('login')} className={`rounded-xl px-4 py-2 text-sm font-medium transition ${mode === 'login' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>
                                Sign in
                            </button>
                            <button type="button" onClick={() => setMode('register')} className={`rounded-xl px-4 py-2 text-sm font-medium transition ${mode === 'register' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>
                                Sign up
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {mode === 'register' && (
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Name</label>
                                    <div className="relative">
                                        <User className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                        <input value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500" placeholder="Alex Morgan" required />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                                <div className="relative">
                                    <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                    <input type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500" placeholder="you@example.com" required />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                                <div className="relative">
                                    <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                    <input type="password" value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500" placeholder="Enter a password" required />
                                </div>
                            </div>

                            <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">
                                {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
                                <ArrowRight className="size-4" />
                            </button>
                        </form>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default AuthPage;