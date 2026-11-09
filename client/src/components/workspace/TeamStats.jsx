import { UsersIcon, Activity, Shield } from 'lucide-react';

export default function TeamStats({
    membersCount,
    projects,
    tasksCount
}) {
    const activeProjectsCount = projects.filter((p) => p.status !== "CANCELLED" && p.status !== "COMPLETED").length;

    return (
        <div className="flex flex-wrap gap-4 text-left">
            {/* Total Members */}
            <div className="max-sm:w-full dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-slate-900/10 dark:border-white/[0.07] rounded-lg p-6">
                <div className="flex items-center justify-between gap-8 md:gap-22">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium">Total Members</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{membersCount}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-brand/10 dark:bg-brand/15">
                        <UsersIcon className="size-4 text-brand dark:text-blue-200" />
                    </div>
                </div>
            </div>

            {/* Active Projects */}
            <div className="max-sm:w-full dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-slate-900/10 dark:border-white/[0.07] rounded-lg p-6">
                <div className="flex items-center justify-between gap-8 md:gap-22">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium">Active Projects</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{activeProjectsCount}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/10">
                        <Activity className="size-4 text-emerald-500 dark:text-emerald-200" />
                    </div>
                </div>
            </div>

            {/* Total Tasks */}
            <div className="max-sm:w-full dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-slate-900/10 dark:border-white/[0.07] rounded-lg p-6">
                <div className="flex items-center justify-between gap-8 md:gap-22">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium">Total Tasks</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{tasksCount}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-brand/10 dark:bg-brand/15">
                        <Shield className="size-4 text-brand dark:text-purple-200" />
                    </div>
                </div>
            </div>
        </div>
    );
}
