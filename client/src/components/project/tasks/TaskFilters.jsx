import { XIcon, Trash } from 'lucide-react';

export default function TaskFilters({
    filters,
    setFilters,
    handleFilterChange,
    assigneeList,
    project,
    selectedTasks,
    handleDelete
}) {
    const stages = project?.stages ? project.stages.split(",") : ["TODO", "IN_PROGRESS", "DONE"];
    
    const options = {
        status: [
            { label: "All Statuses", value: "" },
            ...stages.map(stageId => ({
                label: stageId.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
                value: stageId
            }))
        ],
        type: [
            { label: "All Types", value: "" },
            { label: "Task", value: "TASK" },
            { label: "Bug", value: "BUG" },
            { label: "Feature", value: "FEATURE" },
            { label: "Improvement", value: "IMPROVEMENT" },
            { label: "Other", value: "OTHER" },
        ],
        priority: [
            { label: "All Priorities", value: "" },
            { label: "Low", value: "LOW" },
            { label: "Medium", value: "MEDIUM" },
            { label: "High", value: "HIGH" },
        ],
        assignee: [
            { label: "All Assignees", value: "" },
            ...assigneeList.map((n) => ({ label: n, value: n })),
        ],
    };

    return (
        <div className="flex flex-wrap gap-4 mb-4">
            {["status", "type", "priority", "assignee"].map((name) => (
                <select 
                    key={name} 
                    name={name} 
                    onChange={handleFilterChange} 
                    value={filters[name]}
                    className="border not-dark:bg-white border-zinc-300 dark:border-zinc-800 outline-none px-3 py-1 rounded text-sm text-zinc-900 dark:text-zinc-200" 
                >
                    {options[name].map((opt, idx) => (
                        <option key={idx} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            ))}

            {/* Reset filters */}
            {(filters.status || filters.type || filters.priority || filters.assignee) && (
                <button 
                    type="button" 
                    onClick={() => setFilters({ status: "", type: "", priority: "", assignee: "" })} 
                    className="px-3 py-1 flex items-center gap-2 rounded bg-gradient-to-br from-purple-400 to-purple-500 text-zinc-100 dark:text-zinc-200 text-sm transition-colors cursor-pointer" 
                >
                    <XIcon className="size-3" /> Reset
                </button>
            )}

            {selectedTasks.length > 0 && (
                <button 
                    type="button" 
                    onClick={handleDelete} 
                    className="px-3 py-1 flex items-center gap-2 rounded bg-gradient-to-br from-indigo-400 to-indigo-500 text-zinc-100 dark:text-zinc-200 text-sm transition-colors cursor-pointer" 
                >
                    <Trash className="size-3" /> Delete
                </button>
            )}
        </div>
    );
}
