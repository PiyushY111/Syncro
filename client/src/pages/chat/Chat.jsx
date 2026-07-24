import { useEffect, useState } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { useSelector } from 'react-redux';
import api from '@/configs/api';
import toast from 'react-hot-toast';
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

export default function Chat() {
    const { socket, isConnected, onlineUsers } = useSocket();
    const { user: currentUser } = useAuth();
    const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace);

    const [channels, setChannels] = useState([]);
    const [activeChannel, setActiveChannel] = useState(null);
    const [activeDM, setActiveDM] = useState(null);
    const [messages, setMessages] = useState([]);
    const [typingUser, setTypingUser] = useState(null);
    const [activeThreadMessage, setActiveThreadMessage] = useState(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isBrowserOpen, setIsBrowserOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isPinnedOpen, setIsPinnedOpen] = useState(false);
    const [convertMsg, setConvertMsg] = useState(null);

    useEffect(() => {
        if (!currentWorkspace?.id) return;
        api.get(`/api/chat/workspaces/${currentWorkspace.id}/channels`).then(({ data }) => {
            setChannels(data.channels || []);
            if (data.channels?.length > 0 && !activeChannel && !activeDM) setActiveChannel(data.channels[0]);
        }).catch(console.error);
    }, [currentWorkspace?.id]);

    useEffect(() => {
        if (activeChannel?.id) {
            api.get(`/api/chat/channels/${activeChannel.id}/messages`).then(({ data }) => setMessages(data.messages || [])).catch(console.error);
            if (socket) socket.emit("channel:join", activeChannel.id);
            return () => { if (socket) socket.emit("channel:leave", activeChannel.id); };
        } else if (activeDM?.id) {
            api.get(`/api/chat/direct/${activeDM.id}/messages`).then(({ data }) => setMessages(data.messages || [])).catch(console.error);
        } else {
            setMessages([]);
        }
    }, [activeChannel?.id, activeDM?.id, socket]);

    useEffect(() => {
        if (!socket) return;
        const handleNewMsg = (msg) => {
            const isForActiveChannel = activeChannel && msg.channelId === activeChannel.id;
            const isForActiveDM = activeDM && (
                (msg.userId === activeDM.id && msg.recipientId === currentUser?.id) ||
                (msg.senderId === activeDM.id && msg.recipientId === currentUser?.id) ||
                (msg.userId === currentUser?.id && msg.recipientId === activeDM.id) ||
                (msg.senderId === currentUser?.id && msg.recipientId === activeDM.id)
            );

            if (isForActiveChannel || isForActiveDM) {
                setMessages((prev) => prev.some(m => m.id === msg.id) ? prev : [...prev.filter(m => !(m.id.startsWith("temp-") && m.content === msg.content)), msg]);
            }
        };
        socket.on("message:received", handleNewMsg);
        socket.on("typing:display", ({ user, isTyping }) => setTypingUser(isTyping ? user : null));
        return () => { socket.off("message:received", handleNewMsg); };
    }, [socket, activeChannel, activeDM, currentUser?.id]);

    const handleSendMessage = async (content) => {
        if (!activeChannel && !activeDM) return;
        const tempMsg = { id: `temp-${Date.now()}`, content, senderId: currentUser?.id, user: currentUser, channelId: activeChannel?.id, recipientId: activeDM?.id, createdAt: new Date().toISOString() };
        setMessages((prev) => [...prev, tempMsg]);

        if (socket && isConnected) {
            socket.emit("message:send", { channelId: activeChannel?.id, recipientId: activeDM?.id, content });
        } else {
            api.post('/api/chat/messages', { content, channelId: activeChannel?.id, recipientId: activeDM?.id }).catch(console.error);
        }
    };

    const handlePinMessage = async (msgId) => {
        try {
            const { data } = await api.post(`/api/chat/messages/${msgId}/pin`);
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isPinned: data.isPinned } : m));
            toast.success(data.isPinned ? "Message pinned to channel!" : "Message unpinned");
        } catch { toast.error("Failed to pin message"); }
    };

    const handleStarMessage = async (msgId) => {
        try {
            const { data } = await api.post(`/api/chat/messages/${msgId}/star`);
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isStarred: data.isStarred } : m));
            toast.success(data.isStarred ? "Message starred!" : "Message unstarred");
        } catch { toast.error("Failed to star message"); }
    };

    return (
        <main className="h-full flex bg-white overflow-hidden">
            <ChatChannelSidebar
                channels={channels}
                members={currentWorkspace?.members || []}
                activeChannel={activeChannel}
                activeDM={activeDM}
                onSelectChannel={(ch) => { setActiveChannel(ch); setActiveDM(null); }}
                onSelectDM={(dm) => { setActiveDM(dm); setActiveChannel(null); }}
                onlineUsers={onlineUsers}
                onOpenCreateChannel={() => setIsCreateModalOpen(true)}
                onOpenChannelBrowser={() => setIsBrowserOpen(true)}
            />

            <section className="min-w-0 flex-1 flex flex-col h-full">
                <ChatHeader
                    activeChannel={activeChannel}
                    activeDM={activeDM}
                    onlineUsers={onlineUsers}
                    onOpenPinnedMessages={() => setIsPinnedOpen(true)}
                    onOpenChannelDetails={() => setIsDetailsOpen(true)}
                    workspaceName={currentWorkspace?.name}
                />

                <MessageStream
                    messages={messages}
                    typingUser={typingUser}
                    onReact={(msgId, emoji) => socket?.emit("reaction:add", { messageId: msgId, emoji, channelId: activeChannel?.id })}
                    onOpenThread={(msg) => setActiveThreadMessage(msg)}
                    onDeleteMessage={(msgId) => socket?.emit("message:delete", { messageId: msgId, channelId: activeChannel?.id })}
                    onPinMessage={handlePinMessage}
                    onStarMessage={handleStarMessage}
                    onConvertTask={(msg) => setConvertMsg(msg)}
                />

                <ChatInput onSendMessage={handleSendMessage} onTypingStart={() => socket?.emit("typing:start", { channelId: activeChannel?.id, recipientId: activeDM?.id })} onTypingStop={() => socket?.emit("typing:stop", { channelId: activeChannel?.id, recipientId: activeDM?.id })} />
            </section>

            {activeThreadMessage && <ThreadPanel parentMessage={activeThreadMessage} onClose={() => setActiveThreadMessage(null)} onSendReply={(pId, content) => handleSendMessage(content)} />}

            <CreateChannelModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} workspaceId={currentWorkspace?.id} onChannelCreated={(ch) => { setChannels(prev => [...prev, ch]); setActiveChannel(ch); }} />
            <ChannelBrowserModal isOpen={isBrowserOpen} onClose={() => setIsBrowserOpen(false)} workspaceId={currentWorkspace?.id} onChannelJoined={(ch) => { setChannels(prev => prev.some(c => c.id === ch.id) ? prev : [...prev, ch]); setActiveChannel(ch); }} />
            <ChannelDetailsModal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} channel={activeChannel} workspaceMembers={currentWorkspace?.members || []} messages={messages} onChannelUpdated={(ch) => { setActiveChannel(ch); setChannels((prev) => prev.map((item) => item.id === ch.id ? ch : item)); }} onChannelDeleted={(id) => setChannels(prev => prev.filter(c => c.id !== id))} onSelectDM={(user) => { setActiveDM(user); setActiveChannel(null); setIsDetailsOpen(false); }} />
            <PinnedMessagesModal isOpen={isPinnedOpen} onClose={() => setIsPinnedOpen(false)} channelId={activeChannel?.id} />
            <ConvertMessageModal isOpen={Boolean(convertMsg)} onClose={() => setConvertMsg(null)} message={convertMsg} projects={currentWorkspace?.projects || []} />
        </main>
    );
}
