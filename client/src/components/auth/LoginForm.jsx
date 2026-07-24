import { Lock, Mail, User, ArrowRight } from 'lucide-react';
import { SyncroLogoMark } from '@/components/common/SyncroLogo';

export default function LoginForm({
    mode,
    setMode,
    formData,
    setFormData,
    handleSubmit,
    isSubmitting
}) {
    return (
        <div>
            <div className="mb-6 flex items-center justify-between gap-3 text-left">
                <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-blue-600">{mode === 'login' ? 'Welcome back' : 'Create account'}</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-950">{mode === 'login' ? 'Sign in to continue' : 'Start your workspace'}</h2>
                </div>
                <SyncroLogoMark size="md" />
            </div>

            <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
                <button type="button" onClick={() => setMode('login')} className={`rounded-xl px-4 py-2 text-sm font-medium transition cursor-pointer ${mode === 'login' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>
                    Sign in
                </button>
                <button type="button" onClick={() => setMode('register')} className={`rounded-xl px-4 py-2 text-sm font-medium transition cursor-pointer ${mode === 'register' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>
                    Sign up
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
                {mode === 'register' && (
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Name</label>
                        <div className="relative">
                            <User className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                            <input value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 text-slate-900" placeholder="Alex Morgan" required />
                        </div>
                    </div>
                )}

                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                    <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <input type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 text-slate-900" placeholder="you@example.com" required />
                    </div>
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                    <div className="relative">
                        <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <input type="password" value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 text-slate-900" placeholder="Enter a password" required />
                    </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer">
                    {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
                    <ArrowRight className="size-4" />
                </button>
            </form>
        </div>
    );
}
