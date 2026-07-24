import { NavLink } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Lock, Eye, Server, UserCheck, Bell, Globe } from 'lucide-react';

export default function PrivacyPolicy() {
    const lastUpdated = "July 24, 2026";

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white relative overflow-hidden text-left">
            {/* Background Glow Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.25),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.15),_transparent_35%)] pointer-events-none" />

            {/* Top Navigation */}
            <header className="relative z-10 border-b border-white/10 bg-slate-950/60 backdrop-blur-md px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <NavLink to="/" className="flex items-center gap-2">
                        <img src="/Logos/Syncro(Dark).png" alt="Syncro Logo" className="h-8 w-auto object-contain" />
                    </NavLink>
                    <NavLink to="/auth" className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition">
                        <ArrowLeft className="size-4" /> Back to App
                    </NavLink>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 sm:py-16">
                {/* Hero Banner */}
                <div className="mb-10 p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                    <div className="flex items-center gap-3 text-blue-400 mb-3">
                        <ShieldCheck className="size-6" />
                        <span className="text-xs uppercase tracking-widest font-bold">Legal & Security Compliance</span>
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-sm text-slate-400">
                        Last Updated: <span className="text-slate-200 font-semibold">{lastUpdated}</span>
                    </p>
                </div>

                {/* Content Sections */}
                <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
                    {/* Section 1 */}
                    <section className="p-6 rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-white text-lg font-semibold mb-3">
                            <Eye className="size-5 text-blue-400" />
                            <h2>1. Information We Collect</h2>
                        </div>
                        <p className="mb-3">
                            At <strong>Syncro Platform</strong> ("Syncro", "we", "our"), we collect information necessary to provide seamless project management, real-time collaboration, and Google Calendar synchronization.
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-slate-400">
                            <li><strong className="text-slate-200">Account Data:</strong> Your name, email address, avatar, and authentication credentials when you sign up.</li>
                            <li><strong className="text-slate-200">Workspace & Project Data:</strong> Tasks, task statuses, deadlines, project boards, and team comments created inside your workspaces.</li>
                            <li><strong className="text-slate-200">Google Calendar Data:</strong> When you connect Google Calendar via Google OAuth 2.0, we access your calendar events and email address strictly to insert, update, or sync scheduled meetings and create Google Meet links.</li>
                        </ul>
                    </section>

                    {/* Section 2 */}
                    <section className="p-6 rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-white text-lg font-semibold mb-3">
                            <Server className="size-5 text-indigo-400" />
                            <h2>2. How We Use Your Data</h2>
                        </div>
                        <p className="mb-3">We use your information exclusively for the following purposes:</p>
                        <ul className="list-disc pl-5 space-y-1 text-slate-400">
                            <li>To deliver core workspace features: task tracking, project boards, and team chat.</li>
                            <li>To synchronize meetings scheduled in Syncro with your primary Google Calendar.</li>
                            <li>To send calendar invitations and RSVP notification updates to event attendees (`sendUpdates: "all"`).</li>
                            <li>To secure your account and enforce access permissions across workspaces.</li>
                        </ul>
                    </section>

                    {/* Section 3 */}
                    <section className="p-6 rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-white text-lg font-semibold mb-3">
                            <Lock className="size-5 text-emerald-400" />
                            <h2>3. Google User Data & Security</h2>
                        </div>
                        <p className="mb-3">
                            Syncro's use and transfer of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">Google API Services User Data Policy</a>, including the Limited Use requirements.
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-slate-400">
                            <li>We do <strong>NOT</strong> sell, rent, or trade your Google data to third parties or advertising brokers.</li>
                            <li>OAuth tokens (access and refresh tokens) are encrypted and securely stored in PostgreSQL.</li>
                            <li>You may disconnect Google Sync at any time directly from the Syncro Smart Calendar settings.</li>
                        </ul>
                    </section>

                    {/* Section 4 */}
                    <section className="p-6 rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-white text-lg font-semibold mb-3">
                            <UserCheck className="size-5 text-amber-400" />
                            <h2>4. Data Retention & Deletion</h2>
                        </div>
                        <p>
                            You retain full control over your data. If you wish to delete your account or disconnect Google Calendar, you can trigger data removal through workspace settings or contact our support team at <a href="mailto:syncro@piyushydv.com" className="text-blue-400 underline">syncro@piyushydv.com</a>.
                        </p>
                    </section>

                    {/* Section 5 */}
                    <section className="p-6 rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-white text-lg font-semibold mb-3">
                            <Bell className="size-5 text-cyan-400" />
                            <h2>5. Contact & Questions</h2>
                        </div>
                        <p>
                            For any privacy inquiries or assistance regarding data compliance, please reach out to us at:
                        </p>
                        <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-cyan-300">
                            Email: syncro@piyushydv.com<br />
                            Website: https://syncro.piyushydv.com
                        </div>
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/10 py-6 text-center text-xs text-slate-500">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between px-6 gap-3">
                    <p>© 2026 Syncro Platform. All rights reserved.</p>
                    <div className="flex items-center gap-4">
                        <NavLink to="/terms" className="hover:text-slate-300 transition">Terms of Service</NavLink>
                        <NavLink to="/privacy" className="text-blue-400 font-semibold">Privacy Policy</NavLink>
                    </div>
                </div>
            </footer>
        </div>
    );
}
