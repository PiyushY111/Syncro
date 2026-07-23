import { User, Users } from 'lucide-react';
import CreateWorkspaceDialog from '@/components/workspace/CreateWorkspaceDialog';

export default function NoWorkspaceScreen({
    isCreateWorkspaceOpen,
    setIsCreateWorkspaceOpen,
    handleCreatePersonalWorkspace,
    isCreatingPersonal
}) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-zinc-950">
            <CreateWorkspaceDialog isDialogOpen={isCreateWorkspaceOpen} setIsDialogOpen={setIsCreateWorkspaceOpen} />
            <div className="max-w-3xl w-full text-center">
                {/* Header */}
                <div className="text-center mb-10">
                    <p className="text-xs uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-400 font-bold mb-2">Workspace Setup</p>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl tracking-tight">Choose your workspace style</h1>
                    <p className="mt-3 text-sm text-slate-600 dark:text-zinc-400 max-w-lg mx-auto">
                        Setup is instant. Start working solo in your personal space, or create a custom collaborative space for your team.
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
                                Perfect for tracking your own projects, single-person tasks, and individual goals. No registration details required. Start instantly in your personal sandbox.
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
                                For teams, squads, or companies. Setup projects, assign deliverables, track dependencies, discuss in channels, and invite teammates to work together.
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
