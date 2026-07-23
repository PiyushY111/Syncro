export default function CreateChannelDialog({
    isCreateChannelOpen,
    setIsCreateChannelOpen,
    newChannelName,
    setNewChannelName,
    newChannelDesc,
    setNewChannelDesc,
    newChannelIsPrivate,
    setNewChannelIsPrivate,
    handleCreateChannel,
    colors,
    isDark
}) {
    if (!isCreateChannelOpen) return null;

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
                    Create Group Channel
                </h2>
                <form onSubmit={handleCreateChannel} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500">Channel Name</label>
                        <input
                            value={newChannelName}
                            onChange={(e) => setNewChannelName(e.target.value)}
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
                            value={newChannelDesc}
                            onChange={(e) => setNewChannelDesc(e.target.value)}
                            placeholder="Brief details about discussions"
                            className="w-full rounded border px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            style={{
                                backgroundColor: isDark ? "#18181B" : "#FFFFFF",
                                color: colors.mainText,
                                borderColor: colors.mainBorder
                            }}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500">Channel Visibility</label>
                        <div className="flex gap-4 mt-2">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="radio"
                                    name="channelType"
                                    checked={!newChannelIsPrivate}
                                    onChange={() => setNewChannelIsPrivate(false)}
                                    className="accent-indigo-600"
                                />
                                <span style={{ color: colors.mainText }}>Public</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="radio"
                                    name="channelType"
                                    checked={newChannelIsPrivate}
                                    onChange={() => setNewChannelIsPrivate(true)}
                                    className="accent-indigo-600"
                                />
                                <span style={{ color: colors.mainText }}>Private</span>
                            </label>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">
                            {newChannelIsPrivate 
                                ? "Private channels are only visible to workspace owners, creators, and invited members." 
                                : "Public channels are visible to all workspace members, but require joining to view histories."}
                        </p>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button 
                            type="button" 
                            onClick={() => setIsCreateChannelOpen(false)} 
                            className="rounded border px-4 py-2 text-xs hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                            style={{ color: colors.mainText, borderColor: colors.mainBorder }}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={!newChannelName.trim()} 
                            className="rounded px-4 py-2 text-xs bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer"
                        >
                            Create Channel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
