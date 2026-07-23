import { Lock, Trash2, Plus } from 'lucide-react';

export default function TaskPrerequisites({
    task,
    availablePrereqs,
    selectedPrereqId,
    setSelectedPrereqId,
    handleLinkDependency,
    handleUnlinkDependency
}) {
    return (
        <div className="p-5 rounded-md bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800 flex flex-col gap-4 text-left">
            <h3 className="text-base font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                <Lock className="size-4 text-amber-500" /> Prerequisites (Dependencies)
            </h3>
            
            {/* List of current prerequisites */}
            <div className="space-y-2">
                {task.dependencies && task.dependencies.length > 0 ? (
                    task.dependencies.map(dep => (
                        <div key={dep.id} className="flex items-center justify-between p-2.5 rounded border border-gray-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{dep.title}</span>
                                <span className="text-[10px] text-gray-500 dark:text-zinc-500 capitalize">{dep.type.toLowerCase()} • {dep.status.replace("_", " ")}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${dep.status === "DONE" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400"}`}>
                                    {dep.status === "DONE" ? "Completed" : "Incomplete"}
                                </span>
                                <button onClick={() => handleUnlinkDependency(dep.id)} className="text-zinc-400 hover:text-red-500 p-1 rounded transition-colors cursor-pointer" title="Remove Prerequisite">
                                    <Trash2 className="size-4" />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-xs text-gray-500 dark:text-zinc-500 italic py-2">No prerequisites defined.</p>
                )}
            </div>

            {/* Link new prerequisite selector */}
            {availablePrereqs.length > 0 && (
                <div className="flex gap-2 items-center mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <select value={selectedPrereqId} onChange={(e) => setSelectedPrereqId(e.target.value)} className="flex-1 text-xs bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white rounded border border-gray-300 dark:border-zinc-800 p-2 outline-none cursor-pointer" >
                        <option value="">Select Prerequisite...</option>
                        {availablePrereqs.map(t => (
                            <option key={t.id} value={t.id}>{t.title} ({t.status})</option>
                        ))}
                    </select>
                    <button onClick={handleLinkDependency} disabled={!selectedPrereqId} className="flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs px-3 py-2 rounded font-medium disabled:opacity-50 hover:opacity-90 transition cursor-pointer" >
                        <Plus className="size-3.5 mr-1" /> Link
                    </button>
                </div>
            )}
        </div>
    );
}
