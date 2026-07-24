import { Plus } from 'lucide-react';

export default function AddKanbanColumn({
    canManageStages, showAddColumn, setShowAddColumn,
    newColumnName, setNewColumnName, handleAddColumn
}) {
    if (!canManageStages) return null;

    return (
        <div className="w-[300px] flex-shrink-0 bg-slate-50/50 dark:bg-zinc-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800 p-4 transition text-left">
            {!showAddColumn ? (
                <button
                    onClick={() => setShowAddColumn(true)}
                    className="w-full h-full flex items-center justify-center gap-2 py-8 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                >
                    <Plus className="size-4" /> Add Column
                </button>
            ) : (
                <form onSubmit={handleAddColumn} className="space-y-3">
                    <h4 className="text-xs font-semibold text-gray-700 dark:text-zinc-300">Create Column</h4>
                    <input
                        type="text"
                        required
                        value={newColumnName}
                        onChange={(e) => setNewColumnName(e.target.value)}
                        placeholder="Column Name (e.g. QA)"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-zinc-800 dark:bg-zinc-950 text-gray-900 dark:text-white focus:border-blue-500 outline-none"
                    />
                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={() => setShowAddColumn(false)}
                            className="px-3 py-1.5 text-[10px] font-medium rounded-lg border border-gray-200 dark:border-zinc-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-3 py-1.5 text-[10px] font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 cursor-pointer"
                        >
                            Add
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
