import { Calendar as CalendarIcon } from 'lucide-react';

export default function TaskDatesSelector({ start_date, due_date, onChangeStartDate, onChangeDueDate }) {
    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <label className="text-sm font-medium">Start Date</label>
                <div className="flex items-center gap-2">
                    <CalendarIcon className="size-5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                    <input
                        type="date"
                        value={start_date}
                        onChange={(e) => onChangeStartDate(e.target.value)}
                        className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium">Due Date</label>
                <div className="flex items-center gap-2">
                    <CalendarIcon className="size-5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                    <input
                        type="date"
                        value={due_date}
                        onChange={(e) => onChangeDueDate(e.target.value)}
                        min={start_date || new Date().toISOString().split('T')[0]}
                        className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1"
                    />
                </div>
            </div>
        </div>
    );
}
