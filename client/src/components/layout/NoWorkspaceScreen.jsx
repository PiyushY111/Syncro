import { User, Users, Clock, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react';
import CreateWorkspaceDialog from '@/components/workspace/CreateWorkspaceDialog';

export default function NoWorkspaceScreen({
    isCreateWorkspaceOpen,
    setIsCreateWorkspaceOpen,
    handleCreatePersonalWorkspace,
    isCreatingPersonal,
    pendingWorkspaces = [],
    onRefresh,
}) {
    const hasPending = Array.isArray(pendingWorkspaces) && pendingWorkspaces.length > 0;

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-zinc-950">
            <CreateWorkspaceDialog isDialogOpen={isCreateWorkspaceOpen} setIsDialogOpen={setIsCreateWorkspaceOpen} />
            <div className="max-w-3xl w-full text-center space-y-8">
                {/* Pending Workspace Alert Banner */}
                {hasPending && (
                    <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-left shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                    <Clock className="size-5 animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        Workspace Creation Under Review
                                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                                            Pending Super-Admin
                                        </span>
                                    </h3>
                                    <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
                                        Your workspace request has been received and is awaiting Super-Admin approval. You'll gain access immediately once approved.
                                    </p>
                                </div>
                            </div>

                            {onRefresh && (
                                <button
                                    onClick={onRefresh}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition cursor-pointer self-start sm:self-auto"
                                >
                                    <RefreshCw className="size-3.5" />
                                    Check Status
                                </button>
                            )}
                        </div>

                        <div className="space-y-2 pt-2 border-t border-amber-500/20">
                            {pendingWorkspaces.map((pw) => (
                                <div
                                    key={pw.id}
                                    className="p-3 rounded-2xl bg-white/70 dark:bg-zinc-900/70 border border-amber-500/20 flex items-center justify-between"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">
                                            🏢 {pw.name}
                                        </div>
                                        <div className="text-[11px] text-slate-500 font-mono">
                                            Requested: {new Date(pw.createdAt || Date.now()).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                                        In Verification Queue
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="text-center">
                    <p className="text-xs uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-400 font-bold mb-2">Workspace Setup</p>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl tracking-tight">Choose your workspace style</h1>
                    <p className="mt-3 text-sm text-slate-600 dark:text-zinc-400 max-w-lg mx-auto">
                        Start working solo in your personal space, or create a custom collaborative space with team members and VIP bypass support.
                    </p>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                    {/* Option 1: Work Personal */}
                    <div className="flex flex-col justify-between p-8 rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none hover:border-indigo-500/50 dark:hover:border-indigo-500/30 transition-all duration-200 group">
                        <div>
                            <div className="size-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-200">
                                <User className="size-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Work Personal</h3>
                            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                                Perfect for tracking your own projects, single-person tasks, and individual goals. Start in your personal sandbox.
                            </p>
                        </div>
                        <button 
                            onClick={handleCreatePersonalWorkspace} 
                            disabled={isCreatingPersonal}
                            className="mt-8 w-full rounded-2xl bg-indigo-600 text-white font-medium text-sm py-3 hover:bg-indigo-700 disabled:opacity-60 transition cursor-pointer"
                        >
                            {isCreatingPersonal ? "Launching..." : "Launch Personal Space"}
                        </button>
                    </div>

                    {/* Option 2: Custom Workspace */}
                    <div className="flex flex-col justify-between p-8 rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none hover:border-blue-500/50 dark:hover:border-blue-500/30 transition-all duration-200 group">
                        <div>
                            <div className="size-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-200">
                                <Users className="size-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Create Workspace</h3>
                            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                                For teams, squads, or companies. Setup projects, assign deliverables, track dependencies, discuss in channels, and invite teammates.
                            </p>
                        </div>
                        <button 
                            onClick={() => setIsCreateWorkspaceOpen(true)} 
                            className="mt-8 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-sm py-3 hover:opacity-90 transition cursor-pointer"
                        >
                            Setup Custom Workspace
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
