import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ArrowRight, Check, ChevronRight, CircleCheck, Clock3, FolderKanban,
    Layers3, LockKeyhole, Menu, MessageCircle, Play, Plus, Search,
    ShieldCheck, Sparkles, Users, X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const people = [
    ['AM', 'bg-amber-200 text-amber-900'],
    ['JR', 'bg-sky-200 text-sky-900'],
    ['SL', 'bg-violet-200 text-violet-900'],
    ['NK', 'bg-rose-200 text-rose-900'],
];

const work = [
    { title: 'Website launch', meta: 'Design · Due today', accent: 'bg-[#ffdb75]', progress: 76, avatars: people.slice(0, 3) },
    { title: 'Product backlog', meta: 'Engineering · 12 tasks', accent: 'bg-[#bca7ff]', progress: 48, avatars: people.slice(1, 4) },
    { title: 'Customer onboarding', meta: 'Operations · 8 tasks', accent: 'bg-[#83e1c3]', progress: 92, avatars: people.slice(0, 2) },
];

const featureCards = [
    { icon: FolderKanban, title: 'Projects & task tracking', copy: 'Assign owners, priorities, due dates, and statuses in one shared workspace.' },
    { icon: MessageCircle, title: 'Workspace conversations', copy: 'Keep teams aligned with channels, DMs, threads, member lists, and search.' },
    { icon: ShieldCheck, title: 'Secure by design', copy: 'Custom email-based 2FA safeguards every login without an external auth wall.' },
];

export default function Landing() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        if (!loading && user) navigate('/dashboard', { replace: true });
    }, [loading, user, navigate]);

    const authLink = '/auth';

    return (
        <main className="min-h-screen overflow-hidden bg-[#f8f8f5] text-[#17171a] selection:bg-[#d6ff63]">
            <div className="pointer-events-none absolute left-1/2 top-[-330px] h-[720px] w-[900px] -translate-x-1/2 rounded-full bg-[#e6ff9c]/50 blur-[100px]" />
            <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
                <Link to="/" className="flex items-center"><img src="/Logos/Syncro(Light).png" alt="Syncro" className="h-8 w-auto" /></Link>
                <nav className="hidden items-center gap-7 text-sm font-medium text-zinc-600 md:flex">
                    <a href="#product" className="transition hover:text-zinc-950">Platform</a>
                    <a href="#how-it-works" className="transition hover:text-zinc-950">Features</a>
                    <a href="#security" className="transition hover:text-zinc-950">Security</a>
                </nav>
                <div className="hidden items-center gap-4 md:flex">
                    <Link to={authLink} className="text-sm font-semibold">Log in</Link>
                    <Link to={authLink} className="rounded-full bg-[#17171a] px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-zinc-700">Start for free</Link>
                </div>
                <button onClick={() => setMenuOpen(!menuOpen)} className="grid size-10 place-items-center rounded-full border border-zinc-200 bg-white md:hidden" aria-label="Toggle menu">
                    {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                </button>
                {menuOpen && <div className="absolute right-5 top-16 flex w-52 flex-col rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl md:hidden">
                    <a onClick={() => setMenuOpen(false)} href="#product" className="rounded-xl px-3 py-2 text-sm">Platform</a>
                    <a onClick={() => setMenuOpen(false)} href="#how-it-works" className="rounded-xl px-3 py-2 text-sm">Features</a>
                    <Link to={authLink} className="mt-2 rounded-xl bg-[#17171a] px-3 py-2 text-center text-sm font-semibold text-white">Start for free</Link>
                </div>}
            </header>

            <section className="relative mx-auto max-w-7xl px-5 pb-16 pt-16 text-center sm:px-8 sm:pt-24 lg:px-10 lg:pb-24">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#d4eaa2] bg-[#f6ffd9] px-3.5 py-2 text-xs font-semibold text-zinc-700"><Sparkles className="size-3.5 text-lime-700" /> A project & team collaboration workspace</div>
                <h1 className="mx-auto mt-7 max-w-5xl text-5xl font-semibold leading-[.96] tracking-[-0.065em] sm:text-7xl lg:text-[92px]">Plan projects. Talk as a team.<br /><span className="relative inline-block"><span className="relative z-10">Get work done together.</span><span className="absolute inset-x-0 bottom-1 h-3 -rotate-1 bg-[#d6ff63] sm:bottom-2 sm:h-5" /></span></h1>
                <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">Syncro gives teams one place to create projects, assign and track tasks, discuss work in channels or direct messages, and see progress with workspace analytics.</p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Link to={authLink} className="group flex items-center gap-2 rounded-full bg-[#17171a] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-zinc-900/10 transition hover:-translate-y-0.5">Create your workspace <ArrowRight className="size-4 transition group-hover:translate-x-1" /></Link>
                    <a href="#product" className="flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-6 py-3.5 text-sm font-semibold transition hover:border-zinc-500"><Play className="size-3.5 fill-current" /> Explore Syncro</a>
                </div>
                <p className="mt-4 text-xs text-zinc-500">Start with a personal space or invite your entire team</p>
            </section>

            <section className="relative mx-auto max-w-6xl px-5 pb-20 sm:px-8 lg:px-10">
                <div className="grid overflow-hidden rounded-[2rem] border border-zinc-200 bg-white md:grid-cols-[1.05fr_.95fr]">
                    <div className="p-7 sm:p-10">
                        <p className="text-sm font-semibold text-lime-700">WHAT IS SYNCRO?</p>
                        <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-.04em] sm:text-4xl">The shared home for work that needs a team.</h2>
                        <p className="mt-5 max-w-lg text-sm leading-7 text-zinc-600 sm:text-base">Instead of scattering project plans, task updates, and conversations across separate tools, Syncro keeps the work and the discussion around it in the same workspace.</p>
                    </div>
                    <div className="grid gap-px bg-zinc-200 sm:grid-cols-2 md:grid-cols-1">
                        <div className="bg-[#f6ffd9] p-6 sm:p-8"><FolderKanban className="size-6" /><h3 className="mt-6 font-semibold">Manage the work</h3><p className="mt-2 text-sm leading-6 text-zinc-600">Build project pipelines, create tasks, assign owners, set priorities, and follow deadlines.</p></div>
                        <div className="bg-[#f4efff] p-6 sm:p-8"><MessageCircle className="size-6" /><h3 className="mt-6 font-semibold">Keep people aligned</h3><p className="mt-2 text-sm leading-6 text-zinc-600">Use channels, direct messages, and threaded replies to make decisions in context.</p></div>
                    </div>
                </div>
            </section>

            <section id="product" className="relative mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
                <div className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-[#222225] p-2 shadow-[0_30px_80px_rgba(30,30,30,.18)] sm:rounded-[2.5rem] sm:p-3">
                    <div className="overflow-hidden rounded-[1.6rem] bg-[#f6f5f0] p-4 sm:rounded-[2rem] sm:p-6 lg:p-8">
                        <div className="mb-6 flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-semibold text-zinc-500"><span className="size-2 rounded-full bg-[#ff766d]" /><span className="size-2 rounded-full bg-[#ffd369]" /><span className="size-2 rounded-full bg-[#72d69a]" /><span className="ml-3 hidden sm:inline">Syncro / Team workspace</span></div><div className="flex -space-x-2">{people.slice(0, 3).map(([name, color]) => <span key={name} className={`grid size-7 place-items-center rounded-full border-2 border-[#f6f5f0] text-[8px] font-bold ${color}`}>{name}</span>)}<span className="grid size-7 place-items-center rounded-full border-2 border-[#f6f5f0] bg-[#d6ff63] text-sm">+</span></div></div>
                        <div className="grid gap-5 lg:grid-cols-[1.45fr_.8fr]">
                            <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
                                <div className="flex items-start justify-between"><div><p className="text-xs font-medium text-zinc-500">Acme product workspace</p><h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Task overview</h2></div><button className="grid size-9 place-items-center rounded-xl bg-[#d6ff63]"><Plus className="size-5" /></button></div>
                                <div className="mt-5 space-y-3">{work.map((item) => <div key={item.title} className="rounded-xl border border-zinc-100 bg-[#fbfbfa] p-3.5 sm:flex sm:items-center sm:gap-4"><span className={`mb-3 block size-9 rounded-xl ${item.accent} sm:mb-0`} /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="truncate text-sm font-semibold">{item.title}</p><span className="text-xs font-semibold text-zinc-500">{item.progress}%</span></div><p className="mt-1 text-xs text-zinc-500">{item.meta}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200"><div className="h-full rounded-full bg-zinc-900" style={{ width: `${item.progress}%` }} /></div></div><div className="mt-3 flex -space-x-2 sm:mt-0">{item.avatars.map(([name, color]) => <span key={name} className={`grid size-6 place-items-center rounded-full border-2 border-[#fbfbfa] text-[7px] font-bold ${color}`}>{name}</span>)}</div></div>)}</div>
                            </div>
                            <div className="grid gap-5"><div className="rounded-2xl bg-[#d6ff63] p-5"><div className="flex items-center justify-between"><span className="text-xs font-semibold">Workspace analytics</span><span className="rounded-full bg-black px-2 py-1 text-[10px] font-bold text-white">+18%</span></div><p className="mt-5 text-4xl font-semibold tracking-tight">82<span className="text-lg">%</span></p><p className="mt-1 text-xs text-zinc-700">Tasks completed on schedule</p><div className="mt-5 flex h-16 items-end gap-1.5">{[28, 45, 35, 65, 52, 82, 70].map((height, i) => <span key={i} className="flex-1 rounded-t-sm bg-black/80" style={{ height: `${height}%` }} />)}</div></div><div className="rounded-2xl bg-[#ffd8ce] p-5"><div className="flex items-center gap-2 text-xs font-semibold"><MessageCircle className="size-4" /> Team chat</div><p className="mt-4 text-base font-semibold"># product-launch</p><p className="mt-1 text-xs text-zinc-600">32 messages · 8 members online</p><div className="mt-4 flex items-center justify-between"><div className="flex -space-x-2">{people.slice(1).map(([name, color]) => <span key={name} className={`grid size-6 place-items-center rounded-full border-2 border-[#ffd8ce] text-[7px] font-bold ${color}`}>{name}</span>)}</div><ChevronRight className="size-4" /></div></div></div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-32"><div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]"><div><p className="text-sm font-semibold text-lime-700">WORK, WITHOUT THE SILOS.</p><h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-.045em] sm:text-5xl">Plan it. Discuss it.<br />Finish it together.</h2></div><div className="grid gap-4 sm:grid-cols-3">{featureCards.map((feature, i) => { const FeatureIcon = feature.icon; return <article key={feature.title} className={`rounded-3xl p-6 ${i === 1 ? 'bg-[#d6ff63]' : 'bg-white border border-zinc-200'}`}><FeatureIcon className="size-6" /><h3 className="mt-10 text-lg font-semibold">{feature.title}</h3><p className="mt-3 text-sm leading-6 text-zinc-600">{feature.copy}</p></article>; })}</div></div></section>

            <section id="security" className="bg-[#222225] px-5 py-20 text-white sm:px-8 lg:px-10"><div className="mx-auto flex max-w-5xl flex-col items-center text-center"><span className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-[#d6ff63]"><LockKeyhole className="size-3.5" /> Secure email-code verification</span><h2 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-[-.045em] sm:text-6xl">A workspace your<br />whole team can trust.</h2><p className="mt-5 max-w-xl text-zinc-400">Syncro uses its own email-code verification—not Google sign-in—to protect access. Start with a personal space or build a team workspace with isolated projects, members, and task backlogs.</p><Link to={authLink} className="mt-8 flex items-center gap-2 rounded-full bg-[#d6ff63] px-6 py-3.5 text-sm font-bold text-zinc-950 transition hover:-translate-y-0.5">Start with Syncro <ArrowRight className="size-4" /></Link></div></section>
            <footer className="flex flex-col items-center justify-between gap-4 px-5 py-7 text-xs text-zinc-500 sm:flex-row sm:px-10">
                <img src="/Logos/Syncro(Light).png" alt="Syncro" className="h-6 w-auto" />
                <p>© 2026 Syncro. Project & team collaboration workspace.</p>
                <div className="flex items-center gap-4">
                    <a href="#product">Platform</a>
                    <Link to="/privacy" className="hover:text-zinc-950 transition">Privacy Policy</Link>
                    <Link to="/terms" className="hover:text-zinc-950 transition">Terms of Service</Link>
                    <Link to={authLink} className="font-semibold text-zinc-900">Sign in</Link>
                </div>
            </footer>
        </main>
    );
}
