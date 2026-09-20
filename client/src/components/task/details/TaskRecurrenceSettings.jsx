import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

export default function TaskRecurrenceSettings({
    task,
    handleUpdateRecurrence
}) {
    return (
        <div className="p-5 rounded-md bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800 flex flex-col gap-4 text-left">
            <h3 className="text-base font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                <CalendarIcon className="size-4 text-blue-500" /> Recurring Task Settings
            </h3>
            
            <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-zinc-400 font-medium">Recurrence Status</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${task.isRecurring ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400" : "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400"}`}>
                        {task.isRecurring ? `Recurring (${task.recurrence})` : "Non-recurring"}
                    </span>
                </div>

                {task.lastRecurredAt && (
                    <div className="text-xs text-gray-500 dark:text-zinc-500">
                        Last cloned: {format(new Date(task.lastRecurredAt), "dd MMM yyyy, HH:mm")}
                    </div>
                )}

                <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400">Configure Recurrence</label>
                    <div className="flex gap-2">
                        <select 
                            value={task.isRecurring ? task.recurrence : "NONE"} 
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === "NONE") {
                                    handleUpdateRecurrence(false, "NONE");
                                } else {
                                    handleUpdateRecurrence(true, val);
                                }
                            }}
                            className="flex-1 text-xs bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white rounded border border-gray-300 dark:border-zinc-800 p-2 outline-none cursor-pointer"
                        >
                            <option value="NONE">No Recurrence</option>
                            <option value="DAILY">Daily</option>
                            <option value="WEEKLY">Weekly</option>
                            <option value="MONTHLY">Monthly</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}
