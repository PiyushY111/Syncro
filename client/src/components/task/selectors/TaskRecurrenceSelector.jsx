export default function TaskRecurrenceSelector({
    isRecurring,
    recurrence,
    onChangeRecurring,
    onChangeRecurrence
}) {
    return (
        <div className="space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-3 text-left">
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => onChangeRecurring(e.target.checked)}
                    className="rounded text-blue-500 accent-blue-500"
                />
                <span>Is this a recurring task?</span>
            </label>

            {isRecurring && (
                <div className="space-y-1 mt-1 pl-6">
                    <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400">Recurrence Schedule</label>
                    <select
                        value={recurrence}
                        onChange={(e) => onChangeRecurrence(e.target.value)}
                        className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm focus:outline-none"
                    >
                        <option value="NONE">Select Recurrence...</option>
                        <option value="DAILY">Daily</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="MONTHLY">Monthly</option>
                    </select>
                </div>
            )}
        </div>
    );
}
