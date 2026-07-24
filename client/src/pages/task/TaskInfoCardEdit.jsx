import { Save, X } from 'lucide-react';

export default function TaskInfoCardEdit({
    editData,
    setEditData,
    teamMembers,
    stages,
    onSave,
    onCancel
}) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">Edit Task</h2>
                <div className="flex gap-2">
                    <button
                        onClick={onSave}
                        className="px-3 py-1.5 flex items-center gap-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition cursor-pointer"
                    >
                        <Save className="size-3.5" /> Save
                    </button>
                    <button
                        onClick={onCancel}
                        className="px-3 py-1.5 flex items-center gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition cursor-pointer"
                    >
                        <X className="size-3.5" /> Cancel
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Title</label>
                    <input
                        type="text"
                        value={editData.title}
                        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                        className="w-full rounded dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-blue-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Description</label>
                    <textarea
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        className="w-full rounded dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-blue-500 h-24 resize-none"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Status</label>
                        <select
                            value={editData.status}
                            onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                            className="w-full rounded dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 px-2 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            {stages.map((st) => (
                                <option key={st} value={st}>{st.replace(/_/g, " ").toLowerCase()}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Type</label>
                        <select
                            value={editData.type}
                            onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                            className="w-full rounded dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 px-2 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="BUG">Bug</option>
                            <option value="FEATURE">Feature</option>
                            <option value="TASK">Task</option>
                            <option value="IMPROVEMENT">Improvement</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Priority</label>
                        <select
                            value={editData.priority}
                            onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                            className="w-full rounded dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 px-2 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                        <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Assignee</label>
                        <select
                            value={editData.assigneeId}
                            onChange={(e) => setEditData({ ...editData, assigneeId: e.target.value })}
                            className="w-full rounded dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 px-2 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Unassigned</option>
                            {teamMembers.map((m) => (
                                <option key={m?.user?.id} value={m?.user?.id}>
                                    {m?.user?.name || m?.user?.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={editData.start_date}
                            onChange={(e) => setEditData({ ...editData, start_date: e.target.value })}
                            className="w-full rounded dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 px-2 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Due Date</label>
                        <input
                            type="date"
                            value={editData.due_date}
                            onChange={(e) => setEditData({ ...editData, due_date: e.target.value })}
                            className="w-full rounded dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 px-2 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-blue-500"
                            required
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
