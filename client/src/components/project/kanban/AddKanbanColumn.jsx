import { Plus } from 'lucide-react';

export default function AddKanbanColumn({
    canManageStages, showAddColumn, setShowAddColumn,
    newColumnName, setNewColumnName, handleAddColumn
}) {
    if (!canManageStages) return null;

    return (
        <div className="w-[300px] flex-shrink-0 rounded-3xl border-2 border-dashed border-slate-900/[0.08] p-3 text-left transition-colors hover:border-brand/40 dark:border-white/[0.08] dark:hover:border-lime/40">
            {!showAddColumn ? (
                <button
                    onClick={() => setShowAddColumn(true)}
                    className="w-full h-full flex items-center justify-center gap-2 py-8 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-brand dark:hover:text-violet-200 transition cursor-pointer"
                >
                    <Plus className="size-4" /> Add column
                </button>
            ) : (
                <form onSubmit={handleAddColumn} className="space-y-3">
                    <h4 className="text-xs font-semibold text-gray-700 dark:text-zinc-300">New column</h4>
                    <input
                        type="text"
                        required
                        value={newColumnName}
                        onChange={(e) => setNewColumnName(e.target.value)}
                        placeholder="Column name, e.g. QA"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-900/[0.07] dark:border-white/[0.07] dark:bg-white/[0.04] text-gray-900 dark:text-white focus:border-brand outline-none"
                    />
                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={() => setShowAddColumn(false)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-900/[0.07] dark:border-white/[0.07] text-gray-500 hover:bg-slate-500/[0.06] dark:hover:bg-white/[0.07] cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand text-white hover:bg-brand-strong cursor-pointer"
                        >
                            Add
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
