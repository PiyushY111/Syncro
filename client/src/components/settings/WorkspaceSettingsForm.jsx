import { Settings2, Trash2 } from 'lucide-react';

export default function WorkspaceSettingsForm({
    workspaceName,
    setWorkspaceName,
    workspaceDesc,
    setWorkspaceDesc,
    workspaceImage,
    setWorkspaceImage,
    isUpdatingWorkspace,
    handleUpdateWorkspace,
    isWorkspaceAdmin,
    currentWorkspace,
    user,
    setShowDeleteModal
}) {
    return (
        <div className="space-y-8 divide-y divide-gray-200 dark:divide-zinc-800">
            {/* Edit metadata */}
            <form onSubmit={handleUpdateWorkspace} className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                        <Settings2 size={18} className="text-blue-500" />
                        Workspace Configuration
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">Configure name and information of the workspace.</p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 font-semibold">Workspace Name</label>
                        <input
                            type="text"
                            value={workspaceName}
                            onChange={(e) => setWorkspaceName(e.target.value)}
                            disabled={!isWorkspaceAdmin}
                            className="w-full text-sm px-4 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white focus:border-blue-500 outline-none disabled:opacity-55 disabled:cursor-not-allowed"
                            placeholder="Workspace Name"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 font-semibold">Workspace Avatar URL</label>
                        <input
                            type="text"
                            value={workspaceImage}
                            onChange={(e) => setWorkspaceImage(e.target.value)}
                            disabled={!isWorkspaceAdmin}
                            className="w-full text-sm px-4 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white focus:border-blue-500 outline-none disabled:opacity-55 disabled:cursor-not-allowed"
                            placeholder="https://example.com/workspace.png"
                        />
                        {workspaceImage && (
                            <div className="mt-2 flex items-center gap-3">
                                <img src={workspaceImage} alt="Workspace Preview" className="w-10 h-10 rounded object-cover border border-gray-200 dark:border-zinc-700" onError={(e) => e.target.style.display = 'none'} />
                                <span className="text-xs text-gray-400">Workspace avatar preview</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 font-semibold">Description</label>
                        <textarea
                            value={workspaceDesc}
                            onChange={(e) => setWorkspaceDesc(e.target.value)}
                            disabled={!isWorkspaceAdmin}
                            rows={4}
                            className="w-full text-sm px-4 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white focus:border-blue-500 outline-none disabled:opacity-55 disabled:cursor-not-allowed resize-none"
                            placeholder="Workspace description..."
                        />
                    </div>
                </div>

                {isWorkspaceAdmin && (
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isUpdatingWorkspace}
                            className="px-5 py-2 text-sm font-semibold rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:opacity-95 disabled:opacity-50 transition"
                        >
                            {isUpdatingWorkspace ? 'Updating Workspace...' : 'Update Workspace'}
                        </button>
                    </div>
                )}
            </form>

            {/* Danger zone */}
            {currentWorkspace?.ownerId === user?.id && (
                <div className="pt-8 space-y-4">
                    <div>
                        <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-1 flex items-center gap-2">
                            <Trash2 size={18} />
                            Danger Zone
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">Permanently delete this workspace and all associated projects and tasks.</p>
                    </div>

                    <div className="border border-red-200 dark:border-red-950 bg-red-50/50 dark:bg-red-950/20 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <p className="text-sm font-semibold text-red-800 dark:text-red-300">Delete this workspace</p>
                            <p className="text-xs text-red-700/80 dark:text-red-400/80 mt-0.5">This action cannot be undone. All data will be permanently wiped.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowDeleteModal(true)}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded bg-red-600 text-white hover:bg-red-500 transition cursor-pointer"
                        >
                            <Trash2 size={15} />
                            Delete Workspace
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
