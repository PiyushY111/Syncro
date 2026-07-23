import { ShieldAlert } from 'lucide-react';

export default function WorkspaceDeleteModal({
    showDeleteModal,
    setShowDeleteModal,
    deleteConfirmText,
    setDeleteConfirmText,
    isDeletingWorkspace,
    handleDeleteWorkspace,
    currentWorkspace
}) {
    if (!showDeleteModal) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-left">
                <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
                    <ShieldAlert className="w-6 h-6" />
                    <h3 className="text-lg font-semibold">Delete Workspace</h3>
                </div>

                <p className="text-sm text-gray-600 dark:text-zinc-400 mb-4">
                    Are you absolutely sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">"{currentWorkspace?.name}"</span>? 
                    This will instantly delete all projects, members, tasks, and history associated with this workspace.
                </p>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 dark:text-zinc-400">
                            To confirm, type the workspace name: <span className="font-semibold text-gray-900 dark:text-white">"{currentWorkspace?.name}"</span>
                        </label>
                        <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            className="w-full text-sm px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white outline-none focus:border-red-500"
                            placeholder="Enter workspace name"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                setShowDeleteModal(false);
                                setDeleteConfirmText('');
                            }}
                            className="px-4 py-2 text-sm font-semibold border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300 rounded-xl transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={deleteConfirmText !== currentWorkspace?.name || isDeletingWorkspace}
                            onClick={handleDeleteWorkspace}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:hover:bg-red-600 text-white rounded-xl transition cursor-pointer"
                        >
                            {isDeletingWorkspace ? 'Deleting...' : 'Delete permanently'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
