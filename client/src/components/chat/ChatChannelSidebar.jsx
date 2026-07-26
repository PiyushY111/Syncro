import { Plus, Compass } from 'lucide-react';
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
    canManage = true
}) {
    return (
        <aside className="w-64 shrink-0 flex flex-col h-full bg-white border-r border-zinc-200 overflow-hidden">
            {/* Workspace header */}
            <div className="px-4 pt-4 pb-3 border-b border-zinc-100">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-zinc-900 truncate">Team conversations</h2>
                </div>
                <button
                    onClick={onOpenChannelBrowser}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors cursor-pointer"
                >
                    <Compass className="size-4" />
                    Browse Channels
                </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
                {/* Channels section */}
                <div>
                    <div className="flex items-center justify-between px-2 mb-1">
                        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Channels</span>
                        {canManage && (
                            <button onClick={onOpenCreateChannel} title="Create channel" className="text-zinc-400 hover:text-blue-600 hover:bg-zinc-100 rounded p-0.5 transition cursor-pointer">
                                <Plus className="size-3.5" strokeWidth={2.5} />
                            </button>
                        )}
                    </div>

                    <div className="space-y-0.5">
                        {channels.map((ch) => {
                            const isActive = activeChannel?.id === ch.id && !activeDM;
                            return (
                                <button
                                    key={ch.id}
                                    onClick={() => onSelectChannel(ch)}
                                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-stiff cursor-pointer ${isActive ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-zinc-700 hover:bg-zinc-100'}`}
                                >
                                    <ChannelIcon channel={ch} size="sm" className="rounded-md" />
                                    <span className="truncate">{ch.name}</span>
                                </button>
                            );
                        })}
                        {channels.length === 0 && <p className="px-3 py-2 text-xs text-zinc-400">No channels yet</p>}
                    </div>

                    {canManage && (
                        <button
                            onClick={onOpenCreateChannel}
                            className="flex items-center gap-1.5 px-3 py-1.5 mt-1 text-xs text-zinc-400 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                            <Plus className="size-3.5" />
                            <span>Add channels</span>
                        </button>
                    )}
                </div>

                {/* Direct Messages section */}
                <div className="border-t border-zinc-100 pt-4">
                    <div className="px-2 mb-1">
                        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Direct Messages</span>
                    </div>

                    <div className="space-y-0.5">
                        {members.map((m) => {
                            const isActive = activeDM?.id === m.userId;
                            const isOnline = onlineUsers.includes(m.userId);
                            return (
                                <button
                                    key={m.id}
                                    onClick={() => onSelectDM(m.user)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-stiff cursor-pointer ${isActive ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-zinc-700 hover:bg-zinc-100'}`}
                                >
                                    <div className="relative">
                                        <ChatAvatar name={m.user?.name} imageUrl={m.user?.image} size="sm" />
                                        <span className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-white ${isOnline ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                                    </div>
                                    <span className="truncate">{m.user?.name || 'Unknown member'}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </aside>
    );
}
