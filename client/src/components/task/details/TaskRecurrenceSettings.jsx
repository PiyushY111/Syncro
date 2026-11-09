import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

export default function TaskRecurrenceSettings({
    task,
    handleUpdateRecurrence
}) {
    return (
        <div className="sx-glass p-5 rounded-2xl flex flex-col gap-4 text-left">
            <h3 className="text-base font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                <CalendarIcon className="size-4 text-brand dark:text-violet-300" /> Recurring Task Settings
            </h3>
            
            <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-zinc-400 font-medium">Recurrence Status</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${task.isRecurring ? "bg-brand/10 text-brand dark:bg-brand/15 dark:text-violet-300" : "bg-slate-500/[0.08] text-gray-600 dark:bg-white/[0.06] dark:text-zinc-400"}`}>
                        {task.isRecurring ? `Recurring (${task.recurrence})` : "Non-recurring"}
                    </span>
                </div>

                {task.lastRecurredAt && (
                    <div className="text-xs text-gray-500 dark:text-zinc-500">
                        Last cloned: {format(new Date(task.lastRecurredAt), "dd MMM yyyy, HH:mm")}
                    </div>
                )}

                <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-slate-900/[0.07] dark:border-white/[0.07]">
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
                            className="flex-1 text-xs bg-slate-500/[0.05] dark:bg-white/[0.04] text-gray-900 dark:text-white rounded border border-slate-900/10 dark:border-white/[0.07] p-2 outline-none cursor-pointer"
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
