import { Lock, Hash, User, Users, Settings, Link, UserPlus, Edit, Archive, Trash2 } from "lucide-react";

export default function MessageHeader({
    activeChat,
    isNotMember,
    isMenuOpen,
    setIsMenuOpen,
    joinedChannelMembers,
    setActiveRightPanel,
    handleCopyInviteLink,
    setIsInviteTeammateOpen,
    canEditChannel,
    setEditChannelName,
    setEditChannelDesc,
    activeChannelObj,
    setIsEditChannelOpen,
    handleToggleArchive,
    setConfirmModal,
    colors
}) {
    return (
        <div 
            className="p-4 pr-8 border-b flex items-center justify-between"
            style={{ borderColor: colors.mainBorder }}
        >
            <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                    {activeChat.type === "channel" ? (
                        activeChat.isPrivate ? <Lock className="size-4.5 text-indigo-500" /> : <Hash className="size-5 text-zinc-400" />
                    ) : (
                        <User className="size-5 text-indigo-500" />
                    )}
                    <span 
                        className="font-bold truncate text-base"
                        style={{ color: colors.mainText }}
                    >
                        {activeChat.name}
                    </span>
                    {activeChat.isArchived && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 font-semibold rounded border border-amber-300 uppercase">Archived</span>
                    )}
                </div>
                {activeChat.type === "channel" && (
                    <button 
                        onClick={() => {
                            setActiveRightPanel(prev => prev === "members" ? null : "members");
                        }}
                        className="flex items-center gap-1 text-[11px] font-medium hover:underline mt-0.5 text-left w-fit cursor-pointer"
                        style={{ color: colors.textMuted }}
                    >
                        <Users className="size-3" /> {joinedChannelMembers.length} member{joinedChannelMembers.length === 1 ? "" : "s"}
                    </button>
                )}
            </div>

            {!isNotMember && (
                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition cursor-pointer"
                        style={{ color: colors.mainText }}
                    >
                        <Settings className="size-4.5" />
                    </button>

                    {isMenuOpen && (
                        <div 
                            className="absolute right-0 mt-2 w-48 border rounded-lg shadow-lg z-20 overflow-hidden py-1"
                            style={{ backgroundColor: colors.cardBg, borderColor: colors.mainBorder }}
                        >
                            {activeChat.type === "channel" ? (
                                <>
                                    <button
                                        onClick={handleCopyInviteLink}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left transition hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                                        style={{ color: colors.mainText }}
                                    >
                                        <Link className="size-3.5 text-indigo-500" /> Copy Invite Link
                                    </button>
                                    <button
                                        onClick={() => { setIsInviteTeammateOpen(true); setIsMenuOpen(false); }}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left transition hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                                        style={{ color: colors.mainText }}
                                    >
                                        <UserPlus className="size-3.5 text-emerald-500" /> Invite Teammates
                                    </button>
                                    {canEditChannel && (
                                        <button
                                            onClick={() => {
                                                setEditChannelName(activeChat.name);
                                                setEditChannelDesc(activeChannelObj?.description || "");
                                                setIsEditChannelOpen(true);
                                                setIsMenuOpen(false);
                                            }}
                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left transition hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                                            style={{ color: colors.mainText }}
                                        >
                                            <Edit className="size-3.5 text-blue-500" /> Edit Channel Details
                                        </button>
                                    )}
                                    <hr style={{ borderColor: colors.mainBorder }} />
                                    <button
                                        onClick={handleToggleArchive}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left transition hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                                        style={{ color: colors.mainText }}
                                    >
                                        <Archive className="size-3.5 text-amber-500" /> {activeChat.isArchived ? "Unarchive Channel" : "Archive Channel"}
                                    </button>
                                    <button
                                        onClick={() => setConfirmModal({ isOpen: true, type: "delete_channel", targetId: activeChat.id, targetName: activeChat.name })}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-600 text-left transition hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                                    >
                                        <Trash2 className="size-3.5 text-red-500" /> Delete Channel
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setConfirmModal({ isOpen: true, type: "clear_dm", targetId: activeChat.id, targetName: activeChat.name })}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-600 text-left transition hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                                >
                                    <Trash2 className="size-3.5 text-red-500" /> Clear DM History
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
