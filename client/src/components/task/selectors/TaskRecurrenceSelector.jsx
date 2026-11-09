export default function TaskRecurrenceSelector({
    isRecurring,
    recurrence,
    onChangeRecurring,
    onChangeRecurrence
}) {
    return (
        <div className="space-y-2 border-t border-slate-900/[0.07] dark:border-white/[0.07] pt-3 text-left">
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => onChangeRecurring(e.target.checked)}
                    className="rounded text-brand dark:text-violet-300 accent-blue-500"
                />
                <span>Is this a recurring task?</span>
            </label>

            {isRecurring && (
                <div className="space-y-1 mt-1 pl-6">
                    <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400">Recurrence Schedule</label>
                    <select
                        value={recurrence}
                        onChange={(e) => onChangeRecurrence(e.target.value)}
                        className="w-full rounded dark:bg-white/[0.03] border border-slate-900/10 dark:border-white/10 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm focus:outline-none"
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
