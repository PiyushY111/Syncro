import { Plus, Compass, Star, Search, X } from 'lucide-react';
import ChatAvatar from './ChatAvatar';
import ChannelIcon from './ChannelIcon';

export default function ChatChannelSidebar({
    channels = [],
    members = [],
    activeChannel,
    activeDM,
    onSelectChannel,
    onSelectDM,
    onlineUsers = [],
    onOpenCreateChannel,
    onOpenChannelBrowser,
    canManage = true,
    unreadChats = [],
    unreadMentions = [],
    starredChannelIds = [],
    searchQuery = "",
    setSearchQuery
}) {
    const starredChannels = channels.filter(ch => starredChannelIds.includes(ch.id));
    const regularChannels = channels.filter(ch => !starredChannelIds.includes(ch.id));

    return (
        <aside className="w-64 shrink-0 flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {/* Workspace header */}
            <div className="px-4 pt-4 pb-3 border-b border-zinc-100 dark:border-zinc-800 text-left space-y-2.5">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-zinc-900 dark:text-white truncate">Team conversations</h2>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-zinc-400 size-3.5" />
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search messages..."
                        className="pl-8 pr-7 w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 py-1.5 focus:outline-none focus:border-blue-500 bg-zinc-50 dark:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-800 transition"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery("")} 
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                        >
                            <X className="size-3.5" />
                        </button>
                    )}
                </div>

                <button
                    onClick={onOpenChannelBrowser}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg font-medium transition-colors cursor-pointer"
                >
                    <Compass className="size-4" />
                    Browse Channels
                </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-5 text-left">
                {/* Starred Channels section */}
                {starredChannels.length > 0 && (
                    <div>
                        <div className="flex items-center gap-1.5 px-2 mb-1">
                            <Star className="size-3 text-amber-500 fill-amber-500" />
                            <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Starred</span>
                        </div>

                        <div className="space-y-0.5">
                            {starredChannels.map((ch) => {
                                const isActive = activeChannel?.id === ch.id && !activeDM;
                                const isUnread = unreadChats.includes(ch.id);
                                const hasMention = unreadMentions.includes(ch.id);
                                return (
                                    <button
                                        key={ch.id}
                                        onClick={() => onSelectChannel(ch)}
                                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-stiff cursor-pointer ${
                                            isActive 
                                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 font-semibold' 
                                                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <ChannelIcon channel={ch} size="sm" className="rounded-md" />
                                            <span className={`truncate ${isUnread ? 'font-bold text-zinc-900 dark:text-white' : ''}`}>{ch.name}</span>
                                        </div>
                                        {hasMention ? (
                                            <span className="text-[10px] font-bold text-white bg-rose-500 px-1.5 py-0.5 rounded-full shrink-0 animate-pulse">@</span>
                                        ) : isUnread ? (
                                            <span className="size-2 bg-blue-500 rounded-full shrink-0 animate-pulse" />
                                        ) : null}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Channels section */}
                <div>
                    <div className="flex items-center justify-between px-2 mb-1">
                        <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Channels</span>
                        {canManage && (
                            <button onClick={onOpenCreateChannel} title="Create channel" className="text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded p-0.5 transition cursor-pointer">
                                <Plus className="size-3.5" strokeWidth={2.5} />
                            </button>
                        )}
                    </div>

                    <div className="space-y-0.5">
                        {regularChannels.map((ch) => {
                            const isActive = activeChannel?.id === ch.id && !activeDM;
                            const isUnread = unreadChats.includes(ch.id);
                            const hasMention = unreadMentions.includes(ch.id);
                            return (
                                <button
                                    key={ch.id}
                                    onClick={() => onSelectChannel(ch)}
                                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-stiff cursor-pointer ${
                                        isActive 
                                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 font-semibold' 
                                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <ChannelIcon channel={ch} size="sm" className="rounded-md" />
                                        <span className={`truncate ${isUnread ? 'font-bold text-zinc-900 dark:text-white' : ''}`}>{ch.name}</span>
                                    </div>
                                    {hasMention ? (
                                        <span className="text-[10px] font-bold text-white bg-rose-500 px-1.5 py-0.5 rounded-full shrink-0 animate-pulse">@</span>
                                    ) : isUnread ? (
                                        <span className="size-2 bg-blue-500 rounded-full shrink-0 animate-pulse" />
                                    ) : null}
                                </button>
                            );
                        })}
                        {regularChannels.length === 0 && starredChannels.length === 0 && <p className="px-3 py-2 text-xs text-zinc-400">No channels yet</p>}
                        {regularChannels.length === 0 && starredChannels.length > 0 && <p className="px-3 py-2 text-xs text-zinc-400 italic text-center">All channels starred</p>}
                    </div>

                    {canManage && (
                        <button
                            onClick={onOpenCreateChannel}
                            className="flex items-center gap-1.5 px-3 py-1.5 mt-1 text-xs text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                        >
                            <Plus className="size-3.5" />
                            <span>Add channels</span>
                        </button>
                    )}
                </div>

                {/* Direct Messages section */}
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
                    <div className="px-2 mb-1">
                        <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Direct Messages</span>
                    </div>

                    <div className="space-y-0.5">
                        {members.map((m) => {
                            const isActive = activeDM?.id === m.userId;
                            const isOnline = onlineUsers.includes(m.userId);
                            const isUnread = unreadChats.includes(m.userId);
                            return (
                                <button
                                    key={m.id}
                                    onClick={() => onSelectDM(m.user)}
                                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-stiff cursor-pointer ${
                                        isActive 
                                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 font-semibold' 
                                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 truncate">
                                        <div className="relative">
                                            <ChatAvatar name={m.user?.name} imageUrl={m.user?.image} size="sm" />
                                            <span className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-white dark:ring-zinc-900 ${isOnline ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                                        </div>
                                        <span className={`truncate ${isUnread ? 'font-bold text-zinc-900 dark:text-white' : ''}`}>{m.user?.name || 'Unknown member'}</span>
                                    </div>
                                    {isUnread && (
                                        <span className="size-2 bg-red-500 rounded-full shrink-0" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </aside>
    );
}
