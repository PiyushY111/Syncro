import { X, Search, Hash, Check, MessageSquare } from "lucide-react";

export default function BrowseChannelsDialog({
    isBrowseChannelsOpen,
    setIsBrowseChannelsOpen,
    browseSearchQuery,
    setBrowseSearchQuery,
    filteredPublicChannels,
    currentUser,
    setActiveChat,
    setConfirmModal,
    colors,
    isDark
}) {
    if (!isBrowseChannelsOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/75 backdrop-blur-xs">
            <div 
                className="border rounded-xl shadow-lg w-full max-w-md p-6 animate-in zoom-in-95 duration-100 flex flex-col max-h-[70vh]"
                style={{ backgroundColor: colors.cardBg, borderColor: colors.mainBorder }}
            >
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <h2 className="text-lg font-bold" style={{ color: colors.mainText }}>Browse Public Channels</h2>
                    <button onClick={() => setIsBrowseChannelsOpen(false)} className="text-gray-400 hover:text-red-500 cursor-pointer">
                        <X className="size-5" />
                    </button>
                </div>

                {/* Search Input bar */}
                <div className="relative mb-4 flex-shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                    <input
                        type="text"
                        value={browseSearchQuery}
                        onChange={(e) => setBrowseSearchQuery(e.target.value)}
                        placeholder="Search by channel name..."
                        className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        style={{
                            backgroundColor: isDark ? "#18181B" : "#FFFFFF",
                            color: colors.mainText,
                            borderColor: colors.mainBorder
                        }}
                    />
                </div>

                {/* Public Channels List */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 no-scrollbar">
                    {filteredPublicChannels.length > 0 ? (
                        filteredPublicChannels.map((chan) => {
                            const isJoined = chan.members?.some(m => m.id === currentUser?.id) || chan.creatorId === currentUser?.id;
                            return (
                                <div 
                                    key={chan.id} 
                                    className="flex items-center justify-between p-3 rounded-xl border transition hover:bg-slate-50 dark:hover:bg-zinc-800/10"
                                    style={{ borderColor: colors.mainBorder }}
                                >
                                    <div className="min-w-0 flex-1 pr-3">
                                        <div className="flex items-center gap-1.5">
                                            <Hash className="size-4 text-zinc-400 flex-shrink-0" />
                                            <span className="text-sm font-semibold truncate" style={{ color: colors.mainText }}>
                                                {chan.name}
                                            </span>
                                            {isJoined && (
                                                <span className="text-[8.5px] px-1 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded flex items-center gap-0.5">
                                                    <Check className="size-2.5" /> Joined
                                                </span>
                                            )}
                                        </div>
                                        {chan.description && (
                                            <p className="text-xs truncate mt-0.5" style={{ color: colors.textMuted }}>
                                                {chan.description}
                                            </p>
                                        )}
                                        <p className="text-[10px] mt-1 font-medium" style={{ color: colors.textMuted }}>
                                            {chan.members?.length || 0} member{chan.members?.length === 1 ? "" : "s"}
                                        </p>
                                    </div>
                                    
                                    {!isJoined ? (
                                        <button
                                            onClick={() => setConfirmModal({ isOpen: true, type: "join_channel", targetId: chan.id, targetName: chan.name })}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition flex-shrink-0"
                                        >
                                            Join
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setActiveChat({ type: "channel", id: chan.id, name: chan.name, isArchived: chan.isArchived, isPrivate: chan.isPrivate });
                                                setIsBrowseChannelsOpen(false);
                                            }}
                                            className="border text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition flex-shrink-0 hover:bg-slate-100 dark:hover:bg-zinc-800"
                                            style={{ color: colors.mainText, borderColor: colors.mainBorder }}
                                        >
                                            View
                                        </button>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-10 text-zinc-500">
                            <MessageSquare className="size-10 mx-auto mb-2 text-zinc-400" />
                            <p className="text-xs">No public channels found matching "{browseSearchQuery}"</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
