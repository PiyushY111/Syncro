import { NavLink } from 'react-router-dom';
import { FileText, ArrowRight, Shield, CheckCircle, AlertOctagon, Scale, Mail } from 'lucide-react';

export default function TermsOfService() {
    const lastUpdated = "July 24, 2026";

    return (
        <div className="syncro-landing min-h-screen text-left relative overflow-x-hidden bg-[#fcfcfe]">
            {/* Header Navigation */}
            <header className="relative z-30 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
                <NavLink to="/" className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white text-black shadow-sm border border-slate-200 hover:scale-[1.02] transition">
                    <img src="/Logos/Syncro-S(light).png" alt="Syncro Logo" className="h-6 w-auto object-contain" />
                    <span className="text-lg font-bold text-black tracking-tight">Syncro</span>
                </NavLink>
                <div className="flex items-center gap-6">
                    <NavLink to="/" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition">
                        Home
                    </NavLink>
                    <NavLink to="/auth" className="group flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-500 hover:to-indigo-500 hover:-translate-y-0.5">
                        Back to App <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
                    </NavLink>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-16">
                {/* Hero Banner */}
                <div className="text-center py-12 md:py-20 relative">
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-50/50 px-4 py-2 text-xs font-semibold text-cyan-700 mb-6 shadow-sm">
                        <FileText className="size-3.5 text-cyan-500" />
                        Syncro Terms & Guidelines
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#172033] leading-tight">
                        Terms of Service
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-slate-500 text-base sm:text-lg leading-relaxed">
                        Please read these terms carefully before using the Syncro team collaboration and project management workspace.
                    </p>
                    <p className="mt-6 text-xs text-slate-400">
                        Last Updated: <span className="text-slate-600 font-semibold">{lastUpdated}</span>
                    </p>
                </div>

                {/* Content Sections */}
                <div className="space-y-8 text-slate-600 text-sm leading-relaxed">
                    {/* Section 1 */}
                    <section className="p-8 rounded-3xl border border-slate-100 bg-white/95 backdrop-blur-md shadow-xl shadow-slate-100/30 hover:border-slate-200/80 transition duration-300">
                        <div className="flex items-center gap-2.5 text-[#172033] text-lg font-bold mb-4">
                            <CheckCircle className="size-5 text-blue-500" />
                            <h2>1. Agreement to Terms</h2>
                        </div>
                        <p className="text-slate-600">
                            By accessing or using <strong>Syncro Platform</strong> ("Syncro", "Service"), available at <a href="https://syncro.piyushydv.com" className="text-blue-500 underline font-semibold">https://syncro.piyushydv.com</a>, you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.
                        </p>
                    </section>

                    {/* Section 2 */}
                    <section className="p-8 rounded-3xl border border-slate-100 bg-white/95 backdrop-blur-md shadow-xl shadow-slate-100/30 hover:border-slate-200/80 transition duration-300">
                        <div className="flex items-center gap-2.5 text-[#172033] text-lg font-bold mb-4">
                            <Shield className="size-5 text-indigo-500" />
                            <h2>2. User Accounts & Workspaces</h2>
                        </div>
                        <ul className="list-disc pl-5 space-y-2 text-slate-500">
                            <li>You must provide accurate and complete account information during registration.</li>
                            <li>You are responsible for maintaining the confidentiality of your credentials and workspace permissions.</li>
                            <li>Workspace administrators are responsible for managing member invitations and task access controls.</li>
                        </ul>
                    </section>

                    {/* Section 3 */}
                    <section className="p-8 rounded-3xl border border-slate-100 bg-white/95 backdrop-blur-md shadow-xl shadow-slate-100/30 hover:border-slate-200/80 transition duration-300">
                        <div className="flex items-center gap-2.5 text-[#172033] text-lg font-bold mb-4">
                            <Scale className="size-5 text-emerald-500" />
                            <h2>3. Acceptable Use Policy</h2>
                        </div>
                        <p className="mb-3 text-slate-600">When using Syncro, you agree NOT to:</p>
                        <ul className="list-disc pl-5 space-y-2 text-slate-500">
                            <li>Use the Service for illegal activities or unauthorized automated data extraction.</li>
                            <li>Upload harmful code, malware, or content that violates intellectual property rights.</li>
                            <li>Attempt to gain unauthorized access to other workspace accounts or server infrastructures.</li>
                        </ul>
                    </section>

                    {/* Section 4 */}
                    <section className="p-8 rounded-3xl border border-slate-100 bg-white/95 backdrop-blur-md shadow-xl shadow-slate-100/30 hover:border-slate-200/80 transition duration-300">
                        <div className="flex items-center gap-2.5 text-[#172033] text-lg font-bold mb-4">
                            <AlertOctagon className="size-5 text-amber-500" />
                            <h2>4. Google Calendar Integration & Third-Party Services</h2>
                        </div>
                        <p className="text-slate-600">
                            Syncro integrates with third-party tools such as Google Calendar and Google Meet. Your use of these services is subject to their respective terms. We are not responsible for third-party service disruptions outside our control.
                        </p>
                    </section>

                    {/* Section 5 */}
                    <section className="p-8 rounded-3xl border border-slate-100 bg-white/95 backdrop-blur-md shadow-xl shadow-slate-100/30 hover:border-slate-200/80 transition duration-300">
                        <div className="flex items-center gap-2.5 text-[#172033] text-lg font-bold mb-4">
                            <Mail className="size-5 text-cyan-500" />
                            <h2>5. Contact Information</h2>
                        </div>
                        <p className="mb-4 text-slate-600">
                            If you have any questions regarding these Terms of Service, please contact us:
                        </p>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-mono text-slate-700">
                            Email: syncro@piyushydv.com<br />
                            Website: https://syncro.piyushydv.com
                        </div>
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-20 border-t border-slate-200/60 py-10 text-slate-500 text-xs">
                <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <NavLink to="/" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white text-black shadow-sm border border-slate-200">
                            <img src="/Logos/Syncro-S(light).png" alt="Syncro Logo" className="h-5 w-auto object-contain" />
                            <span className="text-sm font-bold text-black tracking-tight">Syncro</span>
                        </NavLink>
                        <span className="text-slate-300">|</span>
                        <span>© 2026 Syncro Platform. All rights reserved.</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-slate-600 font-semibold">
                        <NavLink to="/" className="hover:text-black transition">Home</NavLink>
                        <NavLink to="/privacy" className="hover:text-black transition">Privacy Policy</NavLink>
                        <NavLink to="/terms" className="hover:text-black transition">Terms of Service</NavLink>
                        <a href="mailto:syncro@piyushydv.com" className="hover:text-black transition flex items-center gap-1">
                            <Mail className="size-3.5 text-blue-500" /> Contact
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
