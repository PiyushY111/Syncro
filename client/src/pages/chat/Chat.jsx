import ChatHeader from '@/components/chat/ChatHeader';
import ChatChannelSidebar from '@/components/chat/ChatChannelSidebar';
import MessageStream from '@/components/chat/MessageStream';
import ChatInput from '@/components/chat/ChatInput';
import ThreadPanel from '@/components/chat/ThreadPanel';
import CreateChannelModal from '@/components/chat/dialogs/CreateChannelModal';
import ChannelBrowserModal from '@/components/chat/dialogs/ChannelBrowserModal';
import ChannelDetailsModal from '@/components/chat/dialogs/ChannelDetailsModal';
import PinnedMessagesModal from '@/components/chat/dialogs/PinnedMessagesModal';
import ConvertMessageModal from '@/components/chat/dialogs/ConvertMessageModal';
import useChatState from './useChatState';

export default function Chat() {
    const s = useChatState();

    return (
        <main className="h-full flex bg-white overflow-hidden">
            <ChatChannelSidebar
                channels={s.channels}
                members={s.currentWorkspace?.members || []}
                activeChannel={s.activeChannel}
                activeDM={s.activeDM}
                onSelectChannel={(ch) => { s.setActiveChannel(ch); s.setActiveDM(null); }}
                onSelectDM={(dm) => { s.setActiveDM(dm); s.setActiveChannel(null); }}
                onlineUsers={s.onlineUsers}
                onOpenCreateChannel={() => s.setIsCreateModalOpen(true)}
                onOpenChannelBrowser={() => s.setIsBrowserOpen(true)}
                canManage={s.canManageChat}
                unreadChats={s.unreadChats}
                unreadMentions={s.unreadMentions}
                starredChannelIds={s.currentUser?.starredChannelIds || []}
                searchQuery={s.searchQuery}
                setSearchQuery={s.setSearchQuery}
            />

            <section className="min-w-0 flex-1 flex flex-col h-full">
                <ChatHeader
                    activeChannel={s.activeChannel}
                    activeDM={s.activeDM}
                    onlineUsers={s.onlineUsers}
                    onOpenPinnedMessages={() => s.setIsPinnedOpen(true)}
                    onOpenChannelDetails={() => s.setIsDetailsOpen(true)}
                    workspaceName={s.currentWorkspace?.name}
                    starredChannelIds={s.currentUser?.starredChannelIds || []}
                    onStarChannel={s.handleStarChannel}
                />

                {s.searchQuery.trim() ? (
                    <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden text-left animate-fade-in">
                        <div className="px-5 py-4 border-b border-zinc-200 bg-white">
                            <h2 className="text-sm font-bold text-zinc-900">Search Results for "{s.searchQuery}"</h2>
                            <p className="text-[11px] text-zinc-405 mt-0.5">Found {s.searchResults.length} matches.</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
                            {s.searchResults.map((m) => (
                                <div key={m.id} onClick={() => s.handleSelectSearchResult(m)} className="p-4 bg-white border border-zinc-200 hover:border-blue-400 rounded-xl cursor-pointer shadow-xs transition duration-200">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-bold text-zinc-900">{m.user?.name || "Unknown"}</span>
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-600">{m.channel ? `#${m.channel.name}` : `DM`}</span>
                                    </div>
                                    <p className="text-xs text-zinc-700 leading-relaxed break-words">{m.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        <MessageStream
                            messages={s.messages}
                            typingUser={s.typingUser}
                            onReact={s.handleToggleReaction}
                            onOpenThread={(m) => s.setActiveThreadMessage(m)}
                            onDeleteMessage={(mId) => s.socket?.emit("message:delete", { messageId: mId, channelId: s.activeChannel?.id })}
                            onPinMessage={s.handlePinMessage}
                            onStarMessage={s.handleStarMessage}
                            onConvertTask={(m) => s.setConvertMsg(m)}
                        />
                        <ChatInput members={s.currentWorkspace?.members || []} onSendMessage={s.handleSendMessage} onTypingStart={() => s.socket?.emit("typing:start", { channelId: s.activeChannel?.id, recipientId: s.activeDM?.id })} onTypingStop={() => s.socket?.emit("typing:stop", { channelId: s.activeChannel?.id, recipientId: s.activeDM?.id })} />
                    </>
                )}
            </section>

            {s.activeThreadMessage && <ThreadPanel parentMessage={s.activeThreadMessage} onClose={() => s.setActiveThreadMessage(null)} onSendReply={(pId, c) => s.handleSendMessage(c)} />}

            <CreateChannelModal isOpen={s.isCreateModalOpen} onClose={() => s.setIsCreateModalOpen(false)} workspaceId={s.currentWorkspace?.id} onChannelCreated={(ch) => { s.setChannels(p => [...p, ch]); s.setActiveChannel(ch); }} />
            <ChannelBrowserModal isOpen={s.isBrowserOpen} onClose={() => s.setIsBrowserOpen(false)} workspaceId={s.currentWorkspace?.id} onChannelJoined={(ch) => { s.setChannels(p => p.some(c => c.id === ch.id) ? p : [...p, ch]); s.setActiveChannel(ch); }} />
            <ChannelDetailsModal isOpen={s.isDetailsOpen} onClose={() => s.setIsDetailsOpen(false)} channel={s.activeChannel} workspaceMembers={s.currentWorkspace?.members || []} messages={s.messages} onChannelUpdated={(ch) => { s.setActiveChannel(ch); s.setChannels(p => p.map(x => x.id === ch.id ? ch : x)); }} onChannelDeleted={(id) => s.setChannels(p => p.filter(c => c.id !== id))} onSelectDM={(u) => { s.setActiveDM(u); s.setActiveChannel(null); s.setIsDetailsOpen(false); }} canManage={s.canManageChat} currentUser={s.currentUser} />
            <PinnedMessagesModal isOpen={s.isPinnedOpen} onClose={() => s.setIsPinnedOpen(false)} channelId={s.activeChannel?.id} />
            <ConvertMessageModal isOpen={Boolean(s.convertMsg)} onClose={() => s.setConvertMsg(null)} message={s.convertMsg} projects={s.currentWorkspace?.projects || []} />
        </main>
    );
}
