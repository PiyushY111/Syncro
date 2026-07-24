import { MessageSquare, Search, Plus, Lock, Hash } from 'lucide-react';
import DirectMessagesList from './DirectMessagesList';

export default function ChatSidebar({
    channels, activeChat, setActiveChat, dmMembers, setIsBrowseChannelsOpen,
    setBrowseSearchQuery, setIsCreateChannelOpen, setIsMenuOpen, colors
}) {
    return (
        <div className="w-64 flex flex-col flex-shrink-0 transition-colors duration-150" style={{ backgroundColor: colors.sidebarBg, color: colors.sidebarText }}>
            <div className="p-4 border-b flex items-center justify-between" style={{ borderBottomColor: colors.sidebarHeaderBorder }}>
                <h3 className="font-bold flex items-center gap-2 text-sm tracking-tight" style={{ color: colors.sidebarText }}>
                    <MessageSquare className="size-4.5 text-indigo-500" /> Workspace Chat
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-6 no-scrollbar">
                <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider mb-2 px-2" style={{ color: colors.textMuted }}>
                        <span>Channels</span>
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => { setIsBrowseChannelsOpen(true); setBrowseSearchQuery(""); }} className="p-0.5 rounded cursor-pointer hover:text-white" style={{ color: colors.sidebarText }} title="Search Public Channels"><Search className="size-3.5" /></button>
                            <button onClick={() => setIsCreateChannelOpen(true)} className="p-0.5 rounded cursor-pointer hover:text-white" style={{ color: colors.sidebarText }} title="Create Channel"><Plus className="size-4" /></button>
                        </div>
                    </div>
                    <div className="space-y-0.5">
                        {channels.map((chan) => {
                            const isActive = activeChat.type === "channel" && activeChat.id === chan.id;
                            return (
                                <button
                                    key={chan.id}
                                    onClick={() => { setActiveChat({ type: "channel", id: chan.id, name: chan.name, isArchived: chan.isArchived, isPrivate: chan.isPrivate }); setIsMenuOpen(false); }}
                                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-md text-sm text-left transition-all cursor-pointer hover:opacity-95"
                                    style={isActive ? { backgroundColor: colors.activePill, color: colors.activeText, fontWeight: "500" } : { color: colors.sidebarText, backgroundColor: "transparent" }}
                                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = colors.sidebarHoverBg; }}
                                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        {chan.isPrivate ? <Lock className={`size-3.5 flex-shrink-0 ${isActive ? "text-indigo-200" : "text-zinc-500"}`} /> : <Hash className={`size-4 flex-shrink-0 ${isActive ? "text-indigo-200" : "text-zinc-500"}`} />}
                                        <span className="truncate">{chan.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {chan.isArchived && <span className="text-[9px] px-1 bg-zinc-800 text-zinc-400 rounded uppercase scale-90">Arch</span>}
                                        {chan.isPrivate && <span className="text-[9px] px-1 bg-indigo-950 text-indigo-300 rounded uppercase scale-90">Priv</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <DirectMessagesList dmMembers={dmMembers} activeChat={activeChat} setActiveChat={setActiveChat} setIsMenuOpen={setIsMenuOpen} colors={colors} />
            </div>
        </div>
    );
}
