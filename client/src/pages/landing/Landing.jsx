import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ArrowRight, Check, ChevronRight, CircleCheck, Clock3, Command,
    Layers3, Menu, Play, Plus, Sparkles, X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const people = [
    ['AM', 'bg-amber-200 text-amber-900'],
    ['JR', 'bg-sky-200 text-sky-900'],
    ['SL', 'bg-violet-200 text-violet-900'],
    ['NK', 'bg-rose-200 text-rose-900'],
];

const work = [
    { title: 'Launch campaign', meta: 'Marketing · Today', accent: 'bg-[#ffdb75]', progress: 76, avatars: people.slice(0, 3) },
    { title: 'Mobile app refresh', meta: 'Product · This week', accent: 'bg-[#bca7ff]', progress: 48, avatars: people.slice(1, 4) },
    { title: 'Q3 content plan', meta: 'Creative · 8 tasks', accent: 'bg-[#83e1c3]', progress: 92, avatars: people.slice(0, 2) },
];

const featureCards = [
    { icon: Layers3, title: 'See the whole picture', copy: 'Projects, tasks, and timelines connect in one effortless view.' },
    { icon: CircleCheck, title: 'Move work forward', copy: 'Turn big ideas into visible progress with clear next steps.' },
    { icon: Sparkles, title: 'Keep the team in flow', copy: 'Give every person the context to do their best work.' },
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
                <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
                    <span className="grid size-9 place-items-center rounded-xl bg-[#17171a] text-[#d6ff63]"><Command className="size-5" strokeWidth={2.5} /></span>
                    flowstate
                </Link>
                <nav className="hidden items-center gap-7 text-sm font-medium text-zinc-600 md:flex">
                    <a href="#product" className="transition hover:text-zinc-950">Product</a>
                    <a href="#how-it-works" className="transition hover:text-zinc-950">How it works</a>
                    <a href="#teams" className="transition hover:text-zinc-950">Teams</a>
                </nav>
                <div className="hidden items-center gap-4 md:flex">
                    <Link to={authLink} className="text-sm font-semibold">Log in</Link>
                    <Link to={authLink} className="rounded-full bg-[#17171a] px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-zinc-700">Start for free</Link>
                </div>
                <button onClick={() => setMenuOpen(!menuOpen)} className="grid size-10 place-items-center rounded-full border border-zinc-200 bg-white md:hidden" aria-label="Toggle menu">
                    {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                </button>
                {menuOpen && <div className="absolute right-5 top-16 flex w-52 flex-col rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl md:hidden">
                    <a onClick={() => setMenuOpen(false)} href="#product" className="rounded-xl px-3 py-2 text-sm">Product</a>
                    <a onClick={() => setMenuOpen(false)} href="#how-it-works" className="rounded-xl px-3 py-2 text-sm">How it works</a>
                    <Link to={authLink} className="mt-2 rounded-xl bg-[#17171a] px-3 py-2 text-center text-sm font-semibold text-white">Start for free</Link>
                </div>}
            </header>

            <section className="relative mx-auto max-w-7xl px-5 pb-16 pt-16 text-center sm:px-8 sm:pt-24 lg:px-10 lg:pb-24">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#d4eaa2] bg-[#f6ffd9] px-3.5 py-2 text-xs font-semibold text-zinc-700"><Sparkles className="size-3.5 text-lime-700" /> The calm way to get work done</div>
                <h1 className="mx-auto mt-7 max-w-5xl text-5xl font-semibold leading-[.96] tracking-[-0.065em] sm:text-7xl lg:text-[92px]">Make space for<br /><span className="relative inline-block"><span className="relative z-10">meaningful work.</span><span className="absolute inset-x-0 bottom-1 h-3 -rotate-1 bg-[#d6ff63] sm:bottom-2 sm:h-5" /></span></h1>
                <p className="mx-auto mt-7 max-w-xl text-base leading-7 text-zinc-600 sm:text-lg">Flowstate brings your projects, people, and priorities into one beautifully clear place — so your team can move with purpose.</p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Link to={authLink} className="group flex items-center gap-2 rounded-full bg-[#17171a] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-zinc-900/10 transition hover:-translate-y-0.5">Start creating for free <ArrowRight className="size-4 transition group-hover:translate-x-1" /></Link>
                    <a href="#product" className="flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-6 py-3.5 text-sm font-semibold transition hover:border-zinc-500"><Play className="size-3.5 fill-current" /> See how it works</a>
                </div>
                <p className="mt-4 text-xs text-zinc-500">No credit card needed · Free forever for small teams</p>
            </section>

            <section id="product" className="relative mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
                <div className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-[#222225] p-2 shadow-[0_30px_80px_rgba(30,30,30,.18)] sm:rounded-[2.5rem] sm:p-3">
                    <div className="overflow-hidden rounded-[1.6rem] bg-[#f6f5f0] p-4 sm:rounded-[2rem] sm:p-6 lg:p-8">
                        <div className="mb-6 flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-semibold text-zinc-500"><span className="size-2 rounded-full bg-[#ff766d]" /><span className="size-2 rounded-full bg-[#ffd369]" /><span className="size-2 rounded-full bg-[#72d69a]" /><span className="ml-3 hidden sm:inline">flowstate / overview</span></div><div className="flex -space-x-2">{people.slice(0, 3).map(([name, color]) => <span key={name} className={`grid size-7 place-items-center rounded-full border-2 border-[#f6f5f0] text-[8px] font-bold ${color}`}>{name}</span>)}<span className="grid size-7 place-items-center rounded-full border-2 border-[#f6f5f0] bg-[#d6ff63] text-sm">+</span></div></div>
                        <div className="grid gap-5 lg:grid-cols-[1.45fr_.8fr]">
                            <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
                                <div className="flex items-start justify-between"><div><p className="text-xs font-medium text-zinc-500">Good morning, Maya</p><h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Focus for today</h2></div><button className="grid size-9 place-items-center rounded-xl bg-[#d6ff63]"><Plus className="size-5" /></button></div>
                                <div className="mt-5 space-y-3">{work.map((item) => <div key={item.title} className="rounded-xl border border-zinc-100 bg-[#fbfbfa] p-3.5 sm:flex sm:items-center sm:gap-4"><span className={`mb-3 block size-9 rounded-xl ${item.accent} sm:mb-0`} /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="truncate text-sm font-semibold">{item.title}</p><span className="text-xs font-semibold text-zinc-500">{item.progress}%</span></div><p className="mt-1 text-xs text-zinc-500">{item.meta}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200"><div className="h-full rounded-full bg-zinc-900" style={{ width: `${item.progress}%` }} /></div></div><div className="mt-3 flex -space-x-2 sm:mt-0">{item.avatars.map(([name, color]) => <span key={name} className={`grid size-6 place-items-center rounded-full border-2 border-[#fbfbfa] text-[7px] font-bold ${color}`}>{name}</span>)}</div></div>)}</div>
                            </div>
                            <div className="grid gap-5"><div className="rounded-2xl bg-[#d6ff63] p-5"><div className="flex items-center justify-between"><span className="text-xs font-semibold">Team velocity</span><span className="rounded-full bg-black px-2 py-1 text-[10px] font-bold text-white">+18%</span></div><p className="mt-5 text-4xl font-semibold tracking-tight">82<span className="text-lg">%</span></p><p className="mt-1 text-xs text-zinc-700">Tasks moving forward this week</p><div className="mt-5 flex h-16 items-end gap-1.5">{[28, 45, 35, 65, 52, 82, 70].map((height, i) => <span key={i} className="flex-1 rounded-t-sm bg-black/80" style={{ height: `${height}%` }} />)}</div></div><div className="rounded-2xl bg-[#ffd8ce] p-5"><div className="flex items-center gap-2 text-xs font-semibold"><Clock3 className="size-4" /> Next up</div><p className="mt-4 text-base font-semibold">Design sync</p><p className="mt-1 text-xs text-zinc-600">Today · 2:30 PM · 4 people</p><div className="mt-4 flex items-center justify-between"><div className="flex -space-x-2">{people.slice(1).map(([name, color]) => <span key={name} className={`grid size-6 place-items-center rounded-full border-2 border-[#ffd8ce] text-[7px] font-bold ${color}`}>{name}</span>)}</div><ChevronRight className="size-4" /></div></div></div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-32"><div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]"><div><p className="text-sm font-semibold text-lime-700">ONE SPACE. TOTAL CLARITY.</p><h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-.045em] sm:text-5xl">Less chasing.<br />More creating.</h2></div><div className="grid gap-4 sm:grid-cols-3">{featureCards.map((feature, i) => { const FeatureIcon = feature.icon; return <article key={feature.title} className={`rounded-3xl p-6 ${i === 1 ? 'bg-[#d6ff63]' : 'bg-white border border-zinc-200'}`}><FeatureIcon className="size-6" /><h3 className="mt-10 text-lg font-semibold">{feature.title}</h3><p className="mt-3 text-sm leading-6 text-zinc-600">{feature.copy}</p></article>; })}</div></div></section>

            <section id="teams" className="bg-[#222225] px-5 py-20 text-white sm:px-8 lg:px-10"><div className="mx-auto flex max-w-5xl flex-col items-center text-center"><span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-[#d6ff63]">Built for teams with momentum</span><h2 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-[-.045em] sm:text-6xl">Your best work is<br />closer than you think.</h2><p className="mt-5 max-w-lg text-zinc-400">Join teams who’ve made clarity their competitive advantage.</p><Link to={authLink} className="mt-8 flex items-center gap-2 rounded-full bg-[#d6ff63] px-6 py-3.5 text-sm font-bold text-zinc-950 transition hover:-translate-y-0.5">Get your team in flow <ArrowRight className="size-4" /></Link></div></section>
            <footer className="flex flex-col items-center justify-between gap-4 px-5 py-7 text-xs text-zinc-500 sm:flex-row sm:px-10"><div className="flex items-center gap-2 font-semibold text-zinc-700"><Command className="size-4" /> flowstate</div><p>© 2026 Flowstate. Make space for what matters.</p><div className="flex gap-4"><a href="#product">Product</a><Link to={authLink}>Sign in</Link></div></footer>
        </main>
    );
}
