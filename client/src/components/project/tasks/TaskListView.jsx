import { format } from 'date-fns';
import { Bug, CalendarIcon, GitCommit, MessageSquare, Square, Zap, Lock } from 'lucide-react';
import TaskMobileListView from './TaskMobileListView';

const typeIcons = {
    BUG: { icon: Bug, color: "text-red-600 dark:text-red-400" },
    FEATURE: { icon: Zap, color: "text-blue-600 dark:text-blue-400" },
    TASK: { icon: Square, color: "text-green-600 dark:text-green-400" },
    IMPROVEMENT: { icon: GitCommit, color: "text-purple-600 dark:text-purple-400" },
    OTHER: { icon: MessageSquare, color: "text-amber-600 dark:text-amber-400" },
};

const priorityTexts = {
    LOW: { background: "bg-red-100 dark:bg-red-950", prioritycolor: "text-red-600 dark:text-red-400" },
    MEDIUM: { background: "bg-blue-100 dark:bg-blue-950", prioritycolor: "text-blue-600 dark:text-blue-400" },
    HIGH: { background: "bg-emerald-100 dark:bg-emerald-950", prioritycolor: "text-emerald-600 dark:text-emerald-400" },
};

export default function TaskListView({
    filteredTasks, selectedTasks, setSelectedTasks, tasks, stages, handleStatusChange, navigate
}) {
    return (
        <div className="overflow-auto rounded-lg lg:border border-zinc-300 dark:border-zinc-800">
            <div className="w-full">
                <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-full text-sm text-left not-dark:bg-white text-zinc-900 dark:text-zinc-300">
                        <thead className="text-xs uppercase dark:bg-zinc-800/70 text-zinc-500 dark:text-zinc-400">
                            <tr>
                                <th className="pl-2 pr-1">
                                    <input 
                                        onChange={() => selectedTasks.length > 0 ? setSelectedTasks([]) : setSelectedTasks(tasks.map((t) => t.id))} 
                                        checked={selectedTasks.length === tasks.length && tasks.length > 0} 
                                        type="checkbox" className="size-3 accent-zinc-600 dark:accent-zinc-500" 
                                    />
                                </th>
                                <th className="px-4 py-3">Title</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Priority</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Assignee</th>
                                <th className="px-4 py-3">Due Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTasks.length > 0 ? (
                                filteredTasks.map((task) => {
                                    const { icon: Icon, color } = typeIcons[task.type] || {};
                                    const { background, prioritycolor } = priorityTexts[task.priority] || {};
                                    return (
                                        <tr key={task.id} onClick={() => navigate(`/taskDetails?projectId=${task.projectId}&taskId=${task.id}`)} className="border-t border-zinc-300 dark:border-zinc-800 group hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all cursor-pointer">
                                            <td onClick={e => e.stopPropagation()} className="pl-2 pr-1">
                                                <input type="checkbox" className="size-3 accent-zinc-600 dark:accent-zinc-500" onChange={() => selectedTasks.includes(task.id) ? setSelectedTasks(selectedTasks.filter((i) => i !== task.id)) : setSelectedTasks((prev) => [...prev, task.id])} checked={selectedTasks.includes(task.id)} />
                                            </td>
                                            <td className="px-4 py-2">
                                                <div className="flex items-center gap-1.5">
                                                    {task.dependencies?.some(d => d.status !== "DONE") && <Lock className="size-3 text-amber-500" title="Blocked" />}
                                                    <span>{task.title}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2">
                                                <div className="flex items-center gap-2">
                                                    {Icon && <Icon className={`size-4 ${color}`} />}
                                                    <span className={`uppercase text-xs ${color}`}>{task.type}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2">
                                                <span className={`text-xs px-2 py-1 rounded ${background} ${prioritycolor}`}>{task.priority}</span>
                                            </td>
                                            <td onClick={e => e.stopPropagation()} className="px-4 py-2">
                                                <select name="status" onChange={(e) => handleStatusChange(task.id, e.target.value)} value={task.status} className="outline-none px-2 pr-4 py-1 rounded text-sm text-zinc-900 dark:text-zinc-200 cursor-pointer">
                                                    {stages.map(stageId => (
                                                        <option key={stageId} value={stageId}>{stageId.replace(/_/g, " ").toLowerCase()}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-2">
                                                <div className="flex items-center gap-2">
                                                    {task.assignee?.image ? <img src={task.assignee.image} className="size-5 rounded-full object-cover" alt="avatar" /> : <div className="size-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px]">{task.assignee?.name?.charAt(0).toUpperCase() || "?"}</div>}
                                                    {task.assignee?.name || "-"}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2">
                                                <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                                                    <CalendarIcon className="size-4" />
                                                    {task.due_date && !isNaN(new Date(task.due_date).getTime()) ? format(new Date(task.due_date), "dd MMMM") : "-"}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="7" className="text-center text-zinc-500 py-6">No tasks found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <TaskMobileListView filteredTasks={filteredTasks} selectedTasks={selectedTasks} setSelectedTasks={setSelectedTasks} typeIcons={typeIcons} priorityTexts={priorityTexts} handleStatusChange={handleStatusChange} stages={stages} />
            </div>
        </div>
    );
}
