import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ArrowRight, CheckCircle2, FolderKanban, CheckSquare, MessageSquare,
    Calendar, RefreshCw, FileText, ShieldCheck, Sparkles, Lock, Mail,
    Play, Eye, ExternalLink, Users, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Landing() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [imgErrors, setImgErrors] = useState({});

    useEffect(() => {
        if (!loading && user) {
            navigate('/dashboard', { replace: true });
        }
    }, [loading, user, navigate]);

    const handleImageError = (tabKey) => {
        setImgErrors(prev => ({ ...prev, [tabKey]: true }));
    };

    const screenshots = [
        {
            key: 'dashboard',
            label: 'Dashboard',
            src: '/screenshots/dashboard.png',
            desc: 'Real-time project overview, workspace metrics, and recent team activity.'
        },
        {
            key: 'kanban',
            label: 'Kanban Board',
            src: '/screenshots/kanban.png',
            desc: 'Organize tasks into status columns, drag-and-drop progress, and set priorities.'
        },
        {
            key: 'calendar',
            label: 'Calendar',
            src: '/screenshots/calendar.png',
            desc: 'Unified Smart Calendar showing tasks, meetings, and 2-way Google Calendar events.'
        },
        {
            key: 'chat',
            label: 'Chat',
            src: '/screenshots/chat.png',
            desc: 'Real-time team messaging channels, direct messages, and project discussions.'
        },
        {
            key: 'tasks',
            label: 'Task List',
            src: '/screenshots/tasks.png',
            desc: 'Detailed task list view with due dates, assignees, tags, and status tracking.'
        }
    ];

    const currentScreenshot = screenshots.find(s => s.key === activeTab) || screenshots[0];

    return (
        <div className="min-h-screen bg-[#090d16] text-slate-100 selection:bg-blue-500 selection:text-white font-sans text-left relative overflow-x-hidden">
            {/* Ambient Background Glows */}
            <div className="pointer-events-none absolute left-1/2 top-[-250px] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-blue-600/15 blur-[120px]" />
            <div className="pointer-events-none absolute right-[-100px] top-[400px] h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[140px]" />

            {/* Header Navigation */}
            <header className="relative z-30 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
                <Link to="/" className="flex items-center gap-3">
                    <img src="/Logos/Syncro(Dark).png" alt="Syncro Logo" className="h-8 w-auto object-contain" />
                    <span className="text-2xl font-bold text-white tracking-tight">Syncro</span>
                </Link>

                <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex">
                    <a href="#features" className="transition hover:text-white">Features</a>
                    <a href="#google-calendar" className="transition hover:text-white">Google Sync</a>
                    <a href="#screenshots" className="transition hover:text-white">Screenshots</a>
                    <Link to="/privacy" className="transition hover:text-white">Privacy Policy</Link>
                    <Link to="/terms" className="transition hover:text-white">Terms of Service</Link>
                </nav>

                <div className="flex items-center gap-4">
                    <Link to="/auth" className="text-sm font-semibold text-slate-300 hover:text-white transition hidden sm:inline-block">
                        Log in
                    </Link>
                    <Link
                        to="/auth"
                        className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-500 hover:to-indigo-500 hover:-translate-y-0.5"
                    >
                        Get Started
                    </Link>
                </div>
            </header>

            {/* Above The Fold (Hero Section) */}
            <section className="relative z-20 mx-auto max-w-6xl px-6 pt-12 pb-20 text-center sm:pt-20 lg:pb-28">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/40 px-4 py-2 text-xs font-semibold text-blue-300 backdrop-blur-md mb-8">
                    <Sparkles className="size-3.5 text-blue-400" />
                    Verified Google Calendar Integration
                </div>

                {/* Main Headline */}
                <h1 className="mx-auto max-w-4xl text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.08]">
                    Syncro
                </h1>
                <p className="mx-auto mt-4 max-w-3xl text-xl sm:text-2xl font-medium text-slate-200 tracking-tight">
                    The all-in-one project management and team collaboration platform.
                </p>

                {/* Main Subheading */}
                <p className="mx-auto mt-6 max-w-3xl text-base sm:text-lg leading-relaxed text-slate-400">
                    Plan projects, assign tasks, chat with your team, schedule meetings, manage files, and sync events with Google Calendar—all from one workspace.
                </p>

                {/* CTA Buttons */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                    <Link
                        to="/auth"
                        className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-blue-600/25 transition hover:from-blue-500 hover:to-indigo-500 hover:-translate-y-0.5"
                    >
                        Get Started <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                    </Link>
                    <a
                        href="#screenshots"
                        className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-7 py-3.5 text-base font-semibold text-slate-200 transition hover:bg-slate-800 hover:border-slate-600"
                    >
                        <Play className="size-4 fill-current text-blue-400" /> View Demo
                    </a>
                </div>

                {/* Google Compliance "Above the Fold" Answers Grid */}
                <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                    <div className="p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">What is Syncro?</span>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            An all-in-one project management and collaboration workspace for modern teams.
                        </p>
                    </div>
                    <div className="p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">Who is it for?</span>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Project managers, software engineering teams, and collaborative organizations.
                        </p>
                    </div>
                    <div className="p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">What does it do?</span>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Combines task boards, real-time team chat, meeting scheduling, and document sharing.
                        </p>
                    </div>
                    <div className="p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">Why Google Access?</span>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            To seamlessly push Syncro meetings to Google Calendar and send automatic event invites.
                        </p>
                    </div>
                </div>
            </section>

            {/* Dedicated Application Purpose Section (Google Verification Requirement) */}
            <section id="purpose" className="relative z-20 mx-auto max-w-6xl px-6 py-16 border-t border-white/10">
                <div className="p-8 sm:p-12 rounded-3xl border border-blue-500/40 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-blue-950/30 backdrop-blur-xl shadow-2xl">
                    <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-widest mb-3">
                        <ShieldCheck className="size-5 text-blue-400" />
                        Application Purpose & Overview
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
                        What is the Purpose of Syncro?
                    </h2>
                    <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-4xl mb-6">
                        <strong>Syncro</strong> is engineered to simplify team operations by unifying project tracking, task management, team chat, and meeting scheduling into one central workspace. It eliminates fragmented communication tools so teams can collaborate effortlessly.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                            <h3 className="text-base font-bold text-white mb-2">Centralized Workspace</h3>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                Organize projects with Kanban boards, assign tasks with due dates, and hold real-time team discussions without context switching.
                            </p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                            <h3 className="text-base font-bold text-white mb-2">Seamless Meeting Scheduling</h3>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                Schedule team meetings, track RSVPs, and automatically generate Google Meet video links directly within your workspace calendar.
                            </p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                            <h3 className="text-base font-bold text-white mb-2">Two-Way Google Calendar Sync</h3>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                Sync scheduled events directly to your primary Google Calendar so all team members receive automatic updates and event reminders.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="relative z-20 mx-auto max-w-6xl px-6 py-20 border-t border-white/10">
                <div className="text-center mb-16">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block mb-2">Core Capabilities</span>
                    <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
                        Everything your team needs
                    </h2>
                    <p className="mt-4 text-base text-slate-400 max-w-2xl mx-auto">
                        Powerful built-in tools engineered to organize workflows and keep your team synchronized.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Card 1: Project Management */}
                    <div className="p-6 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md hover:border-blue-500/40 transition">
                        <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl w-fit mb-4">
                            <FolderKanban className="size-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Project Management</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Create projects, organize workspaces, and track progress with boards and timelines.
                        </p>
                    </div>

                    {/* Card 2: Task Management */}
                    <div className="p-6 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md hover:border-blue-500/40 transition">
                        <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl w-fit mb-4">
                            <CheckSquare className="size-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Task Management</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Assign tasks, set due dates, priorities, labels, and monitor completion.
                        </p>
                    </div>

                    {/* Card 3: Team Chat */}
                    <div className="p-6 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md hover:border-blue-500/40 transition">
                        <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl w-fit mb-4">
                            <MessageSquare className="size-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Team Chat</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Communicate with your team using real-time channels and direct messages.
                        </p>
                    </div>

                    {/* Card 4: Calendar */}
                    <div className="p-6 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md hover:border-blue-500/40 transition">
                        <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl w-fit mb-4">
                            <Calendar className="size-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Calendar</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Schedule meetings and deadlines with a shared calendar.
                        </p>
                    </div>

                    {/* Card 5: Google Calendar Sync */}
                    <div className="p-6 rounded-2xl border border-blue-500/40 bg-blue-950/20 backdrop-blur-md hover:border-blue-400 transition relative overflow-hidden">
                        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl w-fit mb-4">
                            <RefreshCw className="size-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                            Google Calendar Sync
                            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">Official API</span>
                        </h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Connect your Google account to automatically create and update Google Calendar events from Syncro.
                        </p>
                    </div>

                    {/* Card 6: File Sharing */}
                    <div className="p-6 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md hover:border-blue-500/40 transition">
                        <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl w-fit mb-4">
                            <FileText className="size-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">File Sharing</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Upload and organize project documents in one place.
                        </p>
                    </div>
                </div>
            </section>

            {/* How Google Calendar Is Used Section */}
            <section id="google-calendar" className="relative z-20 mx-auto max-w-6xl px-6 py-20 border-t border-white/10">
                <div className="p-8 sm:p-12 rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-950/40 via-slate-900/60 to-slate-950/90 backdrop-blur-xl shadow-2xl">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-widest mb-3">
                            <ShieldCheck className="size-5 text-blue-400" />
                            OAuth 2.0 Integration & Permissions
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
                            Google Calendar Integration
                        </h2>
                        <p className="text-slate-300 text-base leading-relaxed mb-8">
                            Syncro integrates with Google Calendar so you can manage all your meetings and deadlines from one place.
                        </p>

                        <div className="mb-8">
                            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4">
                                When you connect your Google account:
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-start gap-3">
                                    <CheckCircle2 className="size-5 text-emerald-400 shrink-0 mt-0.5" />
                                    <span className="text-sm text-slate-200">Events created in Syncro are added to your Google Calendar.</span>
                                </div>
                                <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-start gap-3">
                                    <CheckCircle2 className="size-5 text-emerald-400 shrink-0 mt-0.5" />
                                    <span className="text-sm text-slate-200">Updates made in Syncro are reflected in Google Calendar.</span>
                                </div>
                                <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-start gap-3">
                                    <CheckCircle2 className="size-5 text-emerald-400 shrink-0 mt-0.5" />
                                    <span className="text-sm text-slate-200">You receive reminders through Google Calendar.</span>
                                </div>
                                <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-start gap-3">
                                    <CheckCircle2 className="size-5 text-emerald-400 shrink-0 mt-0.5" />
                                    <span className="text-sm text-slate-200">Syncro only accesses your calendar after you grant permission.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Screenshots Section */}
            <section id="screenshots" className="relative z-20 mx-auto max-w-6xl px-6 py-20 border-t border-white/10">
                <div className="text-center mb-12">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block mb-2">Product Walkthrough</span>
                    <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
                        See Syncro in Action
                    </h2>
                    <p className="mt-4 text-base text-slate-400 max-w-2xl mx-auto">
                        Explore our interface across Dashboard, Kanban, Smart Calendar, Team Chat, and Task lists.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                    {screenshots.map(s => (
                        <button
                            key={s.key}
                            onClick={() => setActiveTab(s.key)}
                            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                                activeTab === s.key
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
                            }`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>

                {/* Active Tab Screen Viewer */}
                <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-2xl backdrop-blur-xl">
                    <div className="mb-3 px-3 flex items-center justify-between text-xs text-slate-400 border-b border-white/5 pb-3">
                        <div className="flex items-center gap-2">
                            <span className="size-3 rounded-full bg-red-500/80 inline-block" />
                            <span className="size-3 rounded-full bg-amber-500/80 inline-block" />
                            <span className="size-3 rounded-full bg-emerald-500/80 inline-block" />
                            <span className="ml-2 font-mono text-[11px] text-slate-500">https://syncro.piyushydv.com/{activeTab}</span>
                        </div>
                        <span className="font-semibold text-slate-300">{currentScreenshot.desc}</span>
                    </div>

                    <div className="relative rounded-2xl overflow-hidden min-h-[380px] bg-slate-950 flex items-center justify-center border border-white/5">
                        {!imgErrors[currentScreenshot.key] ? (
                            <img
                                src={currentScreenshot.src}
                                alt={`${currentScreenshot.label} Screenshot`}
                                onError={() => handleImageError(currentScreenshot.key)}
                                className="w-full h-auto max-h-[600px] object-cover object-top rounded-xl"
                            />
                        ) : (
                            /* High Fidelity Component Mock Preview if image is not uploaded to /public/screenshots/ yet */
                            <div className="p-8 text-center max-w-lg">
                                <div className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl w-fit mx-auto mb-4">
                                    <Eye className="size-8" />
                                </div>
                                <h4 className="text-xl font-bold text-white mb-2">{currentScreenshot.label} Interface</h4>
                                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                                    {currentScreenshot.desc}
                                </p>
                                <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-[11px] font-mono text-cyan-300">
                                    Upload <code className="text-white font-bold">{currentScreenshot.src}</code> to show your real screenshot here!
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Privacy Statement Box (Near Footer) */}
            <section className="relative z-20 mx-auto max-w-6xl px-6 py-10 border-t border-white/10">
                <div className="p-6 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md flex items-start gap-4">
                    <Lock className="size-6 text-blue-400 shrink-0 mt-1" />
                    <div>
                        <h4 className="text-sm font-bold text-white mb-1">Privacy Guarantee & Google Data Policy</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Syncro requests Google Calendar access only to synchronize events that you create or manage within the application. We do not sell, share, or access your calendar data for advertising purposes.
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-20 border-t border-white/10 py-10 text-slate-400 text-xs">
                <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <img src="/Logos/Syncro(Dark).png" alt="Syncro Logo" className="h-7 w-auto object-contain" />
                        <span className="text-slate-600">|</span>
                        <span>© 2026 Syncro Platform. All rights reserved.</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-slate-300 font-medium">
                        <a href="#features" className="hover:text-white transition">About</a>
                        <Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-white transition">Terms of Service</Link>
                        <a href="mailto:syncro@piyushydv.com" className="hover:text-white transition flex items-center gap-1">
                            <Mail className="size-3.5 text-blue-400" /> Contact
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
