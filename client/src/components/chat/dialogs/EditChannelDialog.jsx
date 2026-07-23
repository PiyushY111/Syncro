export default function EditChannelDialog({
    isEditChannelOpen,
    setIsEditChannelOpen,
    editChannelName,
    setEditChannelName,
    editChannelDesc,
    setEditChannelDesc,
    handleEditChannel,
    colors,
    isDark
}) {
    if (!isEditChannelOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/75 backdrop-blur-xs">
            <div 
                className="border rounded-xl shadow-lg w-full max-w-sm p-6 animate-in zoom-in-95 duration-100"
                style={{ backgroundColor: colors.cardBg, borderColor: colors.mainBorder }}
            >
                <h2 
                    className="text-lg font-bold mb-4"
                    style={{ color: colors.mainText }}
                >
                    Edit Channel Details
                </h2>
                <form onSubmit={handleEditChannel} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500">Channel Name</label>
                        <input
                            value={editChannelName}
                            onChange={(e) => setEditChannelName(e.target.value)}
                            placeholder="e.g. general"
                            className="w-full rounded border px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            style={{
                                backgroundColor: isDark ? "#18181B" : "#FFFFFF",
                                color: colors.mainText,
                                borderColor: colors.mainBorder
                            }}
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500">Description (Optional)</label>
                        <input
                            value={editChannelDesc}
                            onChange={(e) => setEditChannelDesc(e.target.value)}
                            placeholder="Brief details about discussions"
                            className="w-full rounded border px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            style={{
                                backgroundColor: isDark ? "#18181B" : "#FFFFFF",
                                color: colors.mainText,
                                borderColor: colors.mainBorder
                            }}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button 
                            type="button" 
                            onClick={() => setIsEditChannelOpen(false)} 
                            className="rounded border px-4 py-2 text-xs hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                            style={{ color: colors.mainText, borderColor: colors.mainBorder }}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={!editChannelName.trim()} 
                            className="rounded px-4 py-2 text-xs bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
