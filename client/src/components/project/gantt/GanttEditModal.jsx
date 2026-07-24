import { Calendar, X } from 'lucide-react';

export default function GanttEditModal({ selectedTask, setSelectedTask, editingDates, setEditingDates, handleSaveDates, isUpdating }) {
    if (!selectedTask) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-xs">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 w-full max-w-md shadow-2xl text-zinc-900 dark:text-zinc-100">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
                    <h3 className="text-base font-bold flex items-center gap-2">
                        <Calendar className="size-4 text-blue-500" />
                        Adjust Task Schedule
                    </h3>
                    <button type="button" onClick={() => setSelectedTask(null)} className="text-zinc-400 hover:text-zinc-800 dark:hover:text-white cursor-pointer">
                        <X className="size-4" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">Task Title</label>
                        <div className="text-sm font-semibold text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                            {selectedTask.title}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">Start Date</label>
                            <input
                                type="date"
                                value={editingDates.start_date}
                                onChange={(e) => setEditingDates({ ...editingDates, start_date: e.target.value })}
                                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs rounded-lg p-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 font-medium"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">Due Date</label>
                            <input
                                type="date"
                                value={editingDates.due_date}
                                onChange={(e) => setEditingDates({ ...editingDates, due_date: e.target.value })}
                                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs rounded-lg p-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={() => setSelectedTask(null)}
                            className="px-4 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveDates}
                            disabled={isUpdating}
                            className="px-4 py-2 text-xs rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-2xs cursor-pointer"
                        >
                            {isUpdating ? "Saving..." : "Update Schedule"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
