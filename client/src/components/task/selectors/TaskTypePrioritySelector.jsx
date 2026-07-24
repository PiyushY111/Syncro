export default function TaskTypePrioritySelector({
    type,
    priority,
    onChangeType,
    onChangePriority
}) {
    return (
        <div className="grid grid-cols-2 gap-4 text-left">
            <div className="space-y-1">
                <label className="text-sm font-medium">Type</label>
                <select value={type} onChange={(e) => onChangeType(e.target.value)} className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1" >
                    <option value="BUG">Bug</option>
                    <option value="FEATURE">Feature</option>
                    <option value="TASK">Task</option>
                    <option value="IMPROVEMENT">Improvement</option>
                    <option value="OTHER">Other</option>
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium">Priority</label>
                <select value={priority} onChange={(e) => onChangePriority(e.target.value)} className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1" >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                </select>
            </div>
        </div>
    );
}
