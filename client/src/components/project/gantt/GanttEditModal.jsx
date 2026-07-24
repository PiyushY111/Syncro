import { Calendar, X } from 'lucide-react';

export default function GanttEditModal({ selectedTask, setSelectedTask, editingDates, setEditingDates, handleSaveDates, isUpdating }) {
    if (!selectedTask) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 w-full max-w-md shadow-2xl text-zinc-100">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
                    <h3 className="text-base font-semibold flex items-center gap-2">
                        <Calendar className="size-4 text-blue-400" />
                        Adjust Task Schedule
                    </h3>
                    <button onClick={() => setSelectedTask(null)} className="text-zinc-400 hover:text-white cursor-pointer">
                        <X className="size-4" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-medium text-zinc-400 block mb-1">Task Title</label>
                        <div className="text-sm font-semibold text-white bg-zinc-900 p-2.5 rounded border border-zinc-800">
                            {selectedTask.title}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-zinc-400 block mb-1">Start Date</label>
                            <input
                                type="date"
                                value={editingDates.start_date}
                                onChange={(e) => setEditingDates({ ...editingDates, start_date: e.target.value })}
                                className="w-full bg-zinc-900 border border-zinc-700 text-xs rounded p-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-zinc-400 block mb-1">Due Date</label>
                            <input
                                type="date"
                                value={editingDates.due_date}
                                onChange={(e) => setEditingDates({ ...editingDates, due_date: e.target.value })}
                                className="w-full bg-zinc-900 border border-zinc-700 text-xs rounded p-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                        <button
                            type="button"
                            onClick={() => setSelectedTask(null)}
                            className="px-4 py-2 text-xs rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveDates}
                            disabled={isUpdating}
                            className="px-4 py-2 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white font-medium cursor-pointer"
                        >
                            {isUpdating ? "Saving..." : "Update Schedule"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
