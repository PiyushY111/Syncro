import { NavLink } from 'react-router-dom';
import { FileText, ArrowLeft, Shield, CheckCircle, AlertOctagon, Scale, Mail } from 'lucide-react';

export default function TermsOfService() {
    const lastUpdated = "July 24, 2026";

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white relative overflow-hidden text-left">
            {/* Background Glow Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.25),_transparent_40%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.15),_transparent_35%)] pointer-events-none" />

            {/* Top Navigation */}
            <header className="relative z-10 border-b border-white/10 bg-slate-950/60 backdrop-blur-md px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <NavLink to="/" className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white text-black shadow-md border border-slate-200 hover:scale-[1.02] transition">
                        <img src="/Logos/Syncro-S(light).png" alt="Syncro Logo" className="h-6 w-auto object-contain" />
                        <span className="text-lg font-bold text-black tracking-tight">Syncro</span>
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
                    <div className="flex items-center gap-3 text-cyan-400 mb-3">
                        <FileText className="size-6" />
                        <span className="text-xs uppercase tracking-widest font-bold">Legal Agreement</span>
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
                        Terms of Service
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
                            <CheckCircle className="size-5 text-blue-400" />
                            <h2>1. Agreement to Terms</h2>
                        </div>
                        <p>
                            By accessing or using <strong>Syncro Platform</strong> ("Syncro", "Service"), available at <a href="https://syncro.piyushydv.com" className="text-blue-400 underline">https://syncro.piyushydv.com</a>, you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.
                        </p>
                    </section>

                    {/* Section 2 */}
                    <section className="p-6 rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-white text-lg font-semibold mb-3">
                            <Shield className="size-5 text-indigo-400" />
                            <h2>2. User Accounts & Workspaces</h2>
                        </div>
                        <ul className="list-disc pl-5 space-y-1 text-slate-400">
                            <li>You must provide accurate and complete account information during registration.</li>
                            <li>You are responsible for maintaining the confidentiality of your credentials and workspace permissions.</li>
                            <li>Workspace administrators are responsible for managing member invitations and task access controls.</li>
                        </ul>
                    </section>

                    {/* Section 3 */}
                    <section className="p-6 rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-white text-lg font-semibold mb-3">
                            <Scale className="size-5 text-emerald-400" />
                            <h2>3. Acceptable Use Policy</h2>
                        </div>
                        <p className="mb-2">When using Syncro, you agree NOT to:</p>
                        <ul className="list-disc pl-5 space-y-1 text-slate-400">
                            <li>Use the Service for illegal activities or unauthorized automated data extraction.</li>
                            <li>Upload harmful code, malware, or content that violates intellectual property rights.</li>
                            <li>Attempt to gain unauthorized access to other workspace accounts or server infrastructures.</li>
                        </ul>
                    </section>

                    {/* Section 4 */}
                    <section className="p-6 rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-white text-lg font-semibold mb-3">
                            <AlertOctagon className="size-5 text-amber-400" />
                            <h2>4. Google Calendar Integration & Third-Party Services</h2>
                        </div>
                        <p>
                            Syncro integrates with third-party tools such as Google Calendar and Google Meet. Your use of these services is subject to their respective terms. We are not responsible for third-party service disruptions outside our control.
                        </p>
                    </section>

                    {/* Section 5 */}
                    <section className="p-6 rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-white text-lg font-semibold mb-3">
                            <Mail className="size-5 text-cyan-400" />
                            <h2>5. Contact Information</h2>
                        </div>
                        <p>
                            If you have any questions regarding these Terms of Service, please contact us:
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
                        <NavLink to="/terms" className="text-blue-400 font-semibold">Terms of Service</NavLink>
                        <NavLink to="/privacy" className="hover:text-slate-300 transition">Privacy Policy</NavLink>
                    </div>
                </div>
            </footer>
        </div>
    );
}
