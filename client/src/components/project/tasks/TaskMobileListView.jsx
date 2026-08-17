import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

export default function TaskMobileListView({ filteredTasks, selectedTasks, setSelectedTasks, typeIcons, priorityTexts, handleStatusChange, stages }) {
    return (
        <div className="lg:hidden flex flex-col gap-4">
            {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => {
                    const { icon: Icon, color } = typeIcons[task.type] || {};
                    const { background, prioritycolor } = priorityTexts[task.priority] || {};

                    return (
                        <div key={task.id} className="dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-300 dark:border-zinc-800 rounded-lg p-4 flex flex-col gap-2 text-left">
                            <div className="flex items-center justify-between">
                                <h3 className="text-zinc-900 dark:text-zinc-200 text-sm font-semibold">{task.title}</h3>
                                <input 
                                    type="checkbox" 
                                    className="size-4 accent-zinc-600 dark:accent-zinc-500" 
                                    onChange={() => selectedTasks.includes(task.id) ? setSelectedTasks(selectedTasks.filter((i) => i !== task.id)) : setSelectedTasks((prev) => [...prev, task.id])} 
                                    checked={selectedTasks.includes(task.id)} 
                                />
                            </div>

                            <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                                {Icon && <Icon className={`size-4 ${color}`} />}
                                <span className={`${color} uppercase`}>{task.type}</span>
                            </div>

                            <div>
                                <span className={`text-xs px-2 py-1 rounded ${background} ${prioritycolor}`}>
                                    {task.priority}
                                </span>
                            </div>

                            <div>
                                <label className="text-zinc-600 dark:text-zinc-400 text-xs">Status</label>
                                <select 
                                    name="status" 
                                    onChange={(e) => handleStatusChange(task.id, e.target.value)} 
                                    value={task.status} 
                                    className="w-full mt-1 bg-zinc-100 dark:bg-zinc-800 ring-1 ring-zinc-300 dark:ring-zinc-700 outline-none px-2 py-1 rounded text-sm text-zinc-900 dark:text-zinc-200 cursor-pointer"
                                >
                                    {stages.map(stageId => (
                                        <option key={stageId} value={stageId}>
                                            {stageId.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                                {task.assignee?.image ? (
                                    <img src={task.assignee.image} className="size-5 rounded-full object-cover" alt="avatar" />
                                ) : (
                                    <div className="size-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
                                        {task.assignee?.name?.charAt(0).toUpperCase() || "?"}
                                    </div>
                                )}
                                {task.assignee?.name || "-"}
                            </div>

                            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                <CalendarIcon className="size-4" />
                                {task.due_date && !isNaN(new Date(task.due_date).getTime()) ? format(new Date(task.due_date), "dd MMMM") : "-"}
                            </div>
                        </div>
                    );
                })
            ) : (
                <p className="text-center text-zinc-500 dark:text-zinc-400 py-4">
                    No tasks found for the selected filters.
                </p>
            )}
        </div>
    );
}
