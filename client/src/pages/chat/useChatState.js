import { useEffect, useState } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { useSelector } from 'react-redux';
import api from '@/configs/api';
import toast from 'react-hot-toast';
import { getUserWorkspaceRole, canManageChannels } from '@/utils/permissions';

export default function useChatState() {
    const { socket, isConnected, onlineUsers } = useSocket();
    const { user: currentUser, updateUser } = useAuth();
    const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace);
    const currentUserRole = getUserWorkspaceRole(currentWorkspace, currentUser?.id);
    const canManageChat = canManageChannels(currentUserRole, currentWorkspace);

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
    const [unreadChats, setUnreadChats] = useState([]);
    const [unreadMentions, setUnreadMentions] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    useEffect(() => {
        const sync = () => {
            setUnreadChats(JSON.parse(localStorage.getItem('unread_chats') || "[]"));
            setUnreadMentions(JSON.parse(localStorage.getItem('unread_mentions') || "[]"));
        };
        sync();
        window.addEventListener('chat:unread_change', sync);
        return () => window.removeEventListener('chat:unread_change', sync);
    }, []);

    useEffect(() => {
        const id = activeChannel?.id || activeDM?.id;
        if (!id) return localStorage.removeItem('active_chat_id');
        localStorage.setItem('active_chat_id', id);
        let unread = JSON.parse(localStorage.getItem('unread_chats') || "[]");
        let mentions = JSON.parse(localStorage.getItem('unread_mentions') || "[]");
        if (unread.includes(id) || mentions.includes(id)) {
            localStorage.setItem('unread_chats', JSON.stringify(unread.filter(x => x !== id)));
            localStorage.setItem('unread_mentions', JSON.stringify(mentions.filter(x => x !== id)));
            window.dispatchEvent(new CustomEvent('chat:unread_change'));
        }
        return () => localStorage.removeItem('active_chat_id');
    }, [activeChannel?.id, activeDM?.id]);

    useEffect(() => {
        if (!currentWorkspace?.id) return;
        api.get(`/api/chat/workspaces/${currentWorkspace.id}/channels`).then(({ data }) => {
            setChannels(data.channels || []);
            if (data.channels?.length > 0 && !activeChannel && !activeDM) setActiveChannel(data.channels[0]);
        });
    }, [currentWorkspace?.id]);

    useEffect(() => {
        if (activeChannel?.id) {
            api.get(`/api/chat/channels/${activeChannel.id}/messages`).then(({ data }) => setMessages(data.messages || []));
            socket?.emit("channel:join", activeChannel.id);
            return () => { socket?.emit("channel:leave", activeChannel.id); };
        } else if (activeDM?.id) {
            api.get(`/api/chat/direct/${activeDM.id}/messages`).then(({ data }) => setMessages(data.messages || []));
        } else setMessages([]);
    }, [activeChannel?.id, activeDM?.id, socket]);

    useEffect(() => {
        if (!socket) return;
        const onMsg = (m) => {
            const okChan = activeChannel && m.channelId === activeChannel.id;
            const okDM = activeDM && ((m.userId === activeDM.id && m.recipientId === currentUser?.id) || (m.senderId === activeDM.id && m.recipientId === currentUser?.id) || (m.userId === currentUser?.id && m.recipientId === activeDM.id) || (m.senderId === currentUser?.id && m.recipientId === activeDM.id));
            if (okChan || okDM) setMessages(p => p.some(x => x.id === m.id) ? p : [...p.filter(x => !(x.id.startsWith("temp-") && x.content === m.content)), m]);
        };
        const onAdd = ({ messageId, reaction }) => {
            const upd = p => p.map(m => m.id === messageId ? { ...m, reactions: [...(m.reactions || []).filter(r => r.id !== reaction.id), reaction] } : m);
            setMessages(upd); setSearchResults(upd);
        };
        const onRem = ({ messageId, emoji, userId }) => {
            const upd = p => p.map(m => m.id === messageId ? { ...m, reactions: (m.reactions || []).filter(r => !(r.userId === userId && r.emoji === emoji)) } : m);
            setMessages(upd); setSearchResults(upd);
        };
        socket.on("message:received", onMsg);
        socket.on("typing:display", ({ user, isTyping }) => setTypingUser(isTyping ? user : null));
        socket.on("reaction:added", onAdd);
        socket.on("reaction:removed", onRem);
        return () => { socket.off("message:received", onMsg); socket.off("reaction:added", onAdd); socket.off("reaction:removed", onRem); };
    }, [socket, activeChannel, activeDM, currentUser?.id]);

    useEffect(() => {
        if (!searchQuery.trim()) return setSearchResults([]);
        const delay = setTimeout(() => {
            api.get(`/api/chat/search?q=${encodeURIComponent(searchQuery)}`)
                .then(({ data }) => setSearchResults(data.messages || []));
        }, 300);
        return () => clearTimeout(delay);
    }, [searchQuery]);

    const handleSendMessage = async (content) => {
        if (!activeChannel && !activeDM) return;
        const temp = { id: `temp-${Date.now()}`, content, senderId: currentUser?.id, user: currentUser, channelId: activeChannel?.id, recipientId: activeDM?.id, createdAt: new Date().toISOString() };
        setMessages(p => [...p, temp]);
        if (socket && isConnected) socket.emit("message:send", { channelId: activeChannel?.id, recipientId: activeDM?.id, content });
        else api.post('/api/chat/messages', { content, channelId: activeChannel?.id, recipientId: activeDM?.id });
    };

    const handlePinMessage = (id) => {
        api.post(`/api/chat/messages/${id}/pin`).then(({ data }) => {
            setMessages(p => p.map(m => m.id === id ? { ...m, isPinned: data.isPinned } : m));
            toast.success(data.isPinned ? "Message pinned!" : "Message unpinned");
        }).catch(() => toast.error("Failed to pin message"));
    };

    const handleStarMessage = (id) => {
        api.post(`/api/chat/messages/${id}/star`).then(({ data }) => {
            setMessages(p => p.map(m => m.id === id ? { ...m, isStarred: data.isStarred } : m));
            toast.success(data.isStarred ? "Message starred!" : "Message unstarred");
        }).catch(() => toast.error("Failed to star message"));
    };

    const handleStarChannel = (id) => {
        api.post(`/api/chat/channels/${id}/star`).then(({ data }) => {
            updateUser(data.user);
            toast.success(data.isStarred ? "Channel starred!" : "Channel unstarred");
        }).catch(() => toast.error("Failed to star channel"));
    };

    const handleToggleReaction = (msgId, emoji) => {
        const msg = messages.find(m => m.id === msgId) || searchResults.find(m => m.id === msgId);
        if (msg) socket?.emit(msg.reactions?.some(r => r.userId === currentUser.id && r.emoji === emoji) ? "reaction:remove" : "reaction:add", { messageId: msgId, emoji, channelId: activeChannel?.id });
    };

    const handleSelectSearchResult = (m) => {
        if (m.channelId) {
            const ch = channels.find(c => c.id === m.channelId);
            if (ch) { setActiveChannel(ch); setActiveDM(null); }
        } else if (m.recipientId) {
            const other = m.userId === currentUser.id ? m.recipient : m.user;
            if (other) { setActiveDM(other); setActiveChannel(null); }
        }
        setSearchQuery("");
    };

    return {
        socket, isConnected, onlineUsers, currentUser, currentWorkspace, canManageChat,
        channels, setChannels, activeChannel, setActiveChannel, activeDM, setActiveDM,
        messages, setMessages, typingUser, activeThreadMessage, setActiveThreadMessage,
        isCreateModalOpen, setIsCreateModalOpen, isBrowserOpen, setIsBrowserOpen,
        isDetailsOpen, setIsDetailsOpen, isPinnedOpen, setIsPinnedOpen, convertMsg, setConvertMsg,
        unreadChats, unreadMentions, searchQuery, setSearchQuery, searchResults,
        handleSendMessage, handlePinMessage, handleStarMessage, handleStarChannel,
        handleToggleReaction, handleSelectSearchResult
    };
}
