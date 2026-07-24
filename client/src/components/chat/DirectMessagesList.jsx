export default function DirectMessagesList({ dmMembers, activeChat, setActiveChat, setIsMenuOpen, colors }) {
    return (
        <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-2 px-2" style={{ color: colors.textMuted }}>
                Direct Messages
            </div>
            <div className="space-y-0.5">
                {dmMembers.map((member) => {
                    const isActive = activeChat.type === "direct" && activeChat.id === member.user.id;
                    return (
                        <button
                            key={member.user.id}
                            onClick={() => {
                                setActiveChat({ type: "direct", id: member.user.id, name: member.user.name, isArchived: false, isPrivate: false });
                                setIsMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-sm text-left transition-all cursor-pointer hover:opacity-95"
                            style={isActive ? { backgroundColor: colors.activePill, color: colors.activeText, fontWeight: "500" } : { color: colors.sidebarText, backgroundColor: "transparent" }}
                            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = colors.sidebarHoverBg; }}
                            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
                        >
                            {member.user.image ? (
                                <img src={member.user.image} className="size-5 rounded-full object-cover" alt="avatar" />
                            ) : (
                                <div className="size-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-[9px] font-bold">
                                    {member.user.name[0].toUpperCase()}
                                </div>
                            )}
                            <span className="truncate">{member.user.name}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
