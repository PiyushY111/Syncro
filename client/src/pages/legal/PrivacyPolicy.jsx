import { NavLink } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Lock, Eye, Server, UserCheck, Bell, Mail } from 'lucide-react';

export default function PrivacyPolicy() {
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
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-50/50 px-4 py-2 text-xs font-semibold text-blue-700 mb-6 shadow-sm">
                        <ShieldCheck className="size-3.5 text-blue-500" />
                        Syncro Trust Center
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#172033] leading-tight">
                        Privacy Policy
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-slate-500 text-base sm:text-lg leading-relaxed">
                        Learn how we protect and manage your workspace and account data. Dedicated to privacy, security, and developer transparency.
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
                            <Eye className="size-5 text-blue-500" />
                            <h2>1. Information We Collect</h2>
                        </div>
                        <p className="mb-4 text-slate-600">
                            At <strong>Syncro Platform</strong> ("Syncro", "we", "our"), we collect information necessary to provide seamless project management, real-time collaboration, and Google Calendar synchronization.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-slate-500">
                            <li><strong className="text-slate-700">Account Data:</strong> Your name, email address, avatar, and authentication credentials when you sign up.</li>
                            <li><strong className="text-slate-700">Workspace & Project Data:</strong> Tasks, task statuses, deadlines, project boards, and team comments created inside your workspaces.</li>
                            <li><strong className="text-slate-700">Google Calendar Data:</strong> When you connect Google Calendar via Google OAuth 2.0, we access your calendar events and email address strictly to insert, update, or sync scheduled meetings and create Google Meet links.</li>
                        </ul>
                    </section>

                    {/* Section 2 */}
                    <section className="p-8 rounded-3xl border border-slate-100 bg-white/95 backdrop-blur-md shadow-xl shadow-slate-100/30 hover:border-slate-200/80 transition duration-300">
                        <div className="flex items-center gap-2.5 text-[#172033] text-lg font-bold mb-4">
                            <Server className="size-5 text-indigo-500" />
                            <h2>2. How We Use Your Data</h2>
                        </div>
                        <p className="mb-4 text-slate-600">We use your information exclusively for the following purposes:</p>
                        <ul className="list-disc pl-5 space-y-2 text-slate-500">
                            <li>To deliver core workspace features: task tracking, project boards, and team chat.</li>
                            <li>To synchronize meetings scheduled in Syncro with your primary Google Calendar.</li>
                            <li>To send calendar invitations and RSVP notification updates to event attendees (`sendUpdates: "all"`).</li>
                            <li>To secure your account and enforce access permissions across workspaces.</li>
                        </ul>
                    </section>

                    {/* Section 3 */}
                    <section className="p-8 rounded-3xl border border-slate-100 bg-white/95 backdrop-blur-md shadow-xl shadow-slate-100/30 hover:border-slate-200/80 transition duration-300">
                        <div className="flex items-center gap-2.5 text-[#172033] text-lg font-bold mb-4">
                            <Lock className="size-5 text-emerald-500" />
                            <h2>3. Google User Data & Security</h2>
                        </div>
                        <p className="mb-4 text-slate-600">
                            Syncro's use and transfer of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline font-semibold">Google API Services User Data Policy</a>, including the Limited Use requirements.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-slate-500 mb-6">
                            <li>We do <strong>NOT</strong> sell, rent, or trade your Google data to third parties or advertising brokers.</li>
                            <li>OAuth tokens (access and refresh tokens) are encrypted and securely stored in PostgreSQL.</li>
                            <li>You may disconnect Google Sync at any time directly from the Syncro Smart Calendar settings.</li>
                        </ul>

                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <h3 className="text-[#172033] font-bold text-sm mb-3">Technical Data Protection Mechanisms</h3>
                            <p className="mb-4 text-slate-600">
                                To protect your sensitive and restricted data (including Google Calendar API data, user profiles, and tokens), we implement the following industry-standard technical safeguards:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 text-slate-500">
                                <li><strong className="text-slate-700 font-semibold">Encryption in Transit:</strong> All data transmitted between the client application, backend servers, and Google APIs is encrypted using Transport Layer Security (TLS 1.2 or TLS 1.3) protocols.</li>
                                <li><strong className="text-slate-700 font-semibold">Encryption at Rest:</strong> All database records and sensitive OAuth tokens are encrypted at rest using industry-standard Advanced Encryption Standard (AES-256) on cloud database clusters.</li>
                                <li><strong className="text-slate-700 font-semibold">Password Security:</strong> User credentials are protected using bcrypt cryptographic hashing with a high work factor, ensuring plaintext credentials are never stored.</li>
                                <li><strong className="text-slate-700 font-semibold">Access Controls & MFA:</strong> Access to database environments, cloud hosting consoles, and API secrets is strictly limited to authorized personnel using multi-factor authentication (MFA) and least-privilege principles.</li>
                                <li><strong className="text-slate-700 font-semibold">Network Boundaries & Isolation:</strong> Production databases are protected by security group firewalls and isolated from unauthorized internet entry to prevent network breaches.</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 4 */}
                    <section className="p-8 rounded-3xl border border-slate-100 bg-white/95 backdrop-blur-md shadow-xl shadow-slate-100/30 hover:border-slate-200/80 transition duration-300">
                        <div className="flex items-center gap-2.5 text-[#172033] text-lg font-bold mb-4">
                            <UserCheck className="size-5 text-amber-500" />
                            <h2>4. Data Retention & Deletion</h2>
                        </div>
                        <p className="text-slate-600">
                            You retain full control over your data. If you wish to delete your account or disconnect Google Calendar, you can trigger data removal through workspace settings or contact our support team at <a href="mailto:syncro@piyushydv.com" className="text-blue-500 underline font-semibold">syncro@piyushydv.com</a>.
                        </p>
                    </section>

                    {/* Section 5 */}
                    <section className="p-8 rounded-3xl border border-slate-100 bg-white/95 backdrop-blur-md shadow-xl shadow-slate-100/30 hover:border-slate-200/80 transition duration-300">
                        <div className="flex items-center gap-2.5 text-[#172033] text-lg font-bold mb-4">
                            <Bell className="size-5 text-cyan-500" />
                            <h2>5. Contact & Questions</h2>
                        </div>
                        <p className="mb-4 text-slate-600">
                            For any privacy inquiries or assistance regarding data compliance, please reach out to us at:
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
