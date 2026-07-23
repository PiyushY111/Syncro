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
            <div className="max-sm:w-full dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-gray-300 dark:border-zinc-800 rounded-lg p-6">
                <div className="flex items-center justify-between gap-8 md:gap-22">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium">Total Members</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{membersCount}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-500/10">
                        <UsersIcon className="size-4 text-blue-500 dark:text-blue-200" />
                    </div>
                </div>
            </div>

            {/* Active Projects */}
            <div className="max-sm:w-full dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-gray-300 dark:border-zinc-800 rounded-lg p-6">
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
            <div className="max-sm:w-full dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-gray-300 dark:border-zinc-800 rounded-lg p-6">
                <div className="flex items-center justify-between gap-8 md:gap-22">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium">Total Tasks</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{tasksCount}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-500/10">
                        <Shield className="size-4 text-purple-500 dark:text-purple-200" />
                    </div>
                </div>
            </div>
        </div>
    );
}
