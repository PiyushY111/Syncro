import { Sparkles, ShieldCheck, Users, ArrowRight } from 'lucide-react';

const features = [
    'Protected workspaces with invite-based collaboration',
    'Projects, tasks, analytics, and activity in one place',
    'A clean responsive UI built for teams that move fast',
];

export default function AuthFeaturesSection() {
    return (
        <section className="flex flex-col justify-center px-6 py-14 sm:px-10 lg:px-16 xl:px-24">
            <div className="max-w-xl text-left">
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
    );
}
