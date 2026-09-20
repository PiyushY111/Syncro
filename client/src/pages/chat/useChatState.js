import { useEffect, useState, useRef, useCallback } from 'react';
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
    const [isLoadingMessages, setIsLoadingMessages] = useState(true);
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

    // Multi-channel in-memory message store for instant channel & DM switching
    const messagesCacheRef = useRef({});

    // Current chat unique cache key
    const activeChatKey = activeChannel?.id
        ? `ch-${activeChannel.id}`
        : activeDM?.id
        ? `dm-${activeDM.id}`
        : null;

    const activeChatKeyRef = useRef(activeChatKey);
    useEffect(() => {
        activeChatKeyRef.current = activeChatKey;
    }, [activeChatKey]);

    const handleSelectChannel = useCallback((ch) => {
        if (!ch) return;
        if (activeChannel?.id === ch.id && !activeDM) return;
        setIsLoadingMessages(true);
        setMessages([]);
        setActiveChannel(ch);
        setActiveDM(null);
    }, [activeChannel?.id, activeDM]);

    const handleSelectDM = useCallback((dm) => {
        if (!dm) return;
        if (activeDM?.id === dm.id && !activeChannel) return;
        setIsLoadingMessages(true);
        setMessages([]);
        setActiveDM(dm);
        setActiveChannel(null);
    }, [activeDM?.id, activeChannel]);

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

    // Fetch channels with SWR caching
    useEffect(() => {
        if (!currentWorkspace?.id) return;
        api.get(`/api/chat/workspaces/${currentWorkspace.id}/channels`, { cacheTtl: 30000 })
            .then(({ data }) => {
                const fetchedChannels = data.channels || [];
                setChannels(fetchedChannels);
                if (fetchedChannels.length > 0 && !activeChannel && !activeDM) {
                    setActiveChannel(fetchedChannels[0]);
                }
            })
            .catch((err) => console.error("[FETCH CHANNELS ERROR]", err));
    }, [currentWorkspace?.id]);

    // Fast Channel & DM Switching with loading state and immediate previous chat clear
    useEffect(() => {
        if (!activeChatKey) {
            setMessages([]);
            setIsLoadingMessages(false);
            return;
        }

        // Entering new chat: immediately clear previous chat view and show loader
        setIsLoadingMessages(true);
        setMessages([]);

        if (activeChannel?.id) {
            const chId = activeChannel.id;
            socket?.emit("channel:join", chId);

            api.get(`/api/chat/channels/${chId}/messages`, { cacheTtl: 10000 })
                .then(({ data }) => {
                    const fresh = data.messages || [];
                    messagesCacheRef.current[`ch-${chId}`] = fresh;
                    if (activeChatKeyRef.current === `ch-${chId}`) {
                        setMessages(fresh);
                        setIsLoadingMessages(false);
                    }
                })
                .catch((err) => {
                    console.error("[CHANNEL MSGS SWR ERROR]", err);
                    if (activeChatKeyRef.current === `ch-${chId}`) {
                        setIsLoadingMessages(false);
                    }
                });

            return () => {
                socket?.emit("channel:leave", chId);
            };
        } else if (activeDM?.id) {
            const dmId = activeDM.id;
            api.get(`/api/chat/direct/${dmId}/messages`, { cacheTtl: 10000 })
                .then(({ data }) => {
                    const fresh = data.messages || [];
                    messagesCacheRef.current[`dm-${dmId}`] = fresh;
                    if (activeChatKeyRef.current === `dm-${dmId}`) {
                        setMessages(fresh);
                        setIsLoadingMessages(false);
                    }
                })
                .catch((err) => {
                    console.error("[DM MSGS SWR ERROR]", err);
                    if (activeChatKeyRef.current === `dm-${dmId}`) {
                        setIsLoadingMessages(false);
                    }
                });
        }
    }, [activeChannel?.id, activeDM?.id, activeChatKey, socket]);

    // Global Real-Time Socket Event Ingestion across all channels and DMs
    useEffect(() => {
        if (!socket) return;

        const onMsg = (m) => {
            const targetKey = m.channelId
                ? `ch-${m.channelId}`
                : `dm-${(m.userId === currentUser?.id ? m.recipientId : (m.senderId || m.userId))}`;

            // Ingest into background memory cache for that channel/DM
            const cachedList = messagesCacheRef.current[targetKey] || [];
            const withoutTemp = cachedList.filter(x => !(x.id?.startsWith("temp-") && x.content === m.content));
            if (!withoutTemp.some(x => x.id === m.id)) {
                messagesCacheRef.current[targetKey] = [...withoutTemp, m];
            }

            // If it's the currently active chat, update active messages state
            if (activeChatKeyRef.current === targetKey) {
                setMessages(p => {
                    const filtered = p.filter(x => !(x.id?.startsWith("temp-") && x.content === m.content));
                    return filtered.some(x => x.id === m.id) ? p : [...filtered, m];
                });
            }
        };

        const onMsgDeleted = ({ messageId, channelId }) => {
            const filterOut = (list) => (list || []).filter(m => m.id !== messageId);
            if (channelId) {
                messagesCacheRef.current[`ch-${channelId}`] = filterOut(messagesCacheRef.current[`ch-${channelId}`]);
            }
            setMessages(filterOut);
            setSearchResults(filterOut);
        };

        const onMsgPinned = ({ messageId, isPinned }) => {
            const mapPin = (list) => (list || []).map(m => m.id === messageId ? { ...m, isPinned } : m);
            if (activeChatKeyRef.current) {
                messagesCacheRef.current[activeChatKeyRef.current] = mapPin(messagesCacheRef.current[activeChatKeyRef.current]);
            }
            setMessages(mapPin);
            setSearchResults(mapPin);
        };

        const onAdd = ({ messageId, reaction }) => {
            const upd = (list) => (list || []).map(m =>
                m.id === messageId
                    ? { ...m, reactions: [...(m.reactions || []).filter(r => r.id !== reaction.id), reaction] }
                    : m
            );
            if (activeChatKeyRef.current) {
                messagesCacheRef.current[activeChatKeyRef.current] = upd(messagesCacheRef.current[activeChatKeyRef.current]);
            }
            setMessages(upd);
            setSearchResults(upd);
        };

        const onRem = ({ messageId, emoji, userId }) => {
            const upd = (list) => (list || []).map(m =>
                m.id === messageId
                    ? { ...m, reactions: (m.reactions || []).filter(r => !(r.userId === userId && r.emoji === emoji)) }
                    : m
            );
            if (activeChatKeyRef.current) {
                messagesCacheRef.current[activeChatKeyRef.current] = upd(messagesCacheRef.current[activeChatKeyRef.current]);
            }
            setMessages(upd);
            setSearchResults(upd);
        };

        const onTyping = ({ channelId, user, isTyping }) => {
            if (channelId) {
                if (channelId === activeChannel?.id) {
                    setTypingUser(isTyping ? user : null);
                }
            } else if (activeDM && (user?.id === activeDM?.id)) {
                setTypingUser(isTyping ? user : null);
            }
        };

        const onDirectCleared = ({ otherUserId }) => {
            const key = `dm-${otherUserId}`;
            delete messagesCacheRef.current[key];
            if (activeChatKeyRef.current === key) {
                setMessages([]);
            }
        };

        socket.on("message:received", onMsg);
        socket.on("message:deleted", onMsgDeleted);
        socket.on("message:pinned", onMsgPinned);
        socket.on("reaction:added", onAdd);
        socket.on("reaction:removed", onRem);
        socket.on("typing:display", onTyping);
        socket.on("direct:cleared", onDirectCleared);

        return () => {
            socket.off("message:received", onMsg);
            socket.off("message:deleted", onMsgDeleted);
            socket.off("message:pinned", onMsgPinned);
            socket.off("reaction:added", onAdd);
            socket.off("reaction:removed", onRem);
            socket.off("typing:display", onTyping);
            socket.off("direct:cleared", onDirectCleared);
        };
    }, [socket, activeChannel?.id, activeDM?.id, currentUser?.id]);

    // Search query with debounced SWR
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        const delay = setTimeout(() => {
            api.get(`/api/chat/search?q=${encodeURIComponent(searchQuery)}`, { cacheTtl: 15000 })
                .then(({ data }) => setSearchResults(data.messages || []))
                .catch(() => {});
        }, 250);
        return () => clearTimeout(delay);
    }, [searchQuery]);

    // 0ms Optimistic Message Sending
    const handleSendMessage = useCallback(async (content) => {
        if (!activeChannel && !activeDM) return;
        if (!content || !content.trim()) return;

        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const tempMsg = {
            id: tempId,
            content: content.trim(),
            senderId: currentUser?.id,
            userId: currentUser?.id,
            user: currentUser,
            channelId: activeChannel?.id || null,
            recipientId: activeDM?.id || null,
            createdAt: new Date().toISOString(),
            reactions: [],
            _count: { replies: 0 },
            isSending: true,
        };

        // Instant optimistic append in UI and cache (0ms)
        setMessages(p => [...p, tempMsg]);
        if (activeChatKeyRef.current) {
            messagesCacheRef.current[activeChatKeyRef.current] = [
                ...(messagesCacheRef.current[activeChatKeyRef.current] || []),
                tempMsg
            ];
        }

        if (socket && isConnected) {
            socket.emit("message:send", {
                channelId: activeChannel?.id,
                recipientId: activeDM?.id,
                content: content.trim()
            });
        } else {
            try {
                const { data } = await api.post('/api/chat/messages', {
                    content: content.trim(),
                    channelId: activeChannel?.id,
                    recipientId: activeDM?.id
                });
                if (data?.message) {
                    const confirmed = data.message;
                    setMessages(p => p.map(m => m.id === tempId ? confirmed : m));
                    if (activeChatKeyRef.current) {
                        messagesCacheRef.current[activeChatKeyRef.current] =
                            (messagesCacheRef.current[activeChatKeyRef.current] || []).map(m => m.id === tempId ? confirmed : m);
                    }
                }
            } catch {
                toast.error("Failed to send message");
                setMessages(p => p.filter(m => m.id !== tempId));
            }
        }
    }, [activeChannel, activeDM, currentUser, socket, isConnected]);

    // 0ms Optimistic Reaction Toggle
    const handleToggleReaction = useCallback((msgId, emoji) => {
        const currentTargetKey = activeChatKeyRef.current;
        let wasAdded = false;

        setMessages(prev => prev.map(m => {
            if (m.id !== msgId) return m;
            const existingReaction = (m.reactions || []).find(r => r.userId === currentUser?.id && r.emoji === emoji);
            let nextReactions;
            if (existingReaction) {
                wasAdded = false;
                nextReactions = m.reactions.filter(r => !(r.userId === currentUser?.id && r.emoji === emoji));
            } else {
                wasAdded = true;
                const newR = { id: `react-${Date.now()}`, emoji, userId: currentUser?.id, user: currentUser };
                nextReactions = [...(m.reactions || []), newR];
            }
            return { ...m, reactions: nextReactions };
        }));

        if (currentTargetKey && messagesCacheRef.current[currentTargetKey]) {
            messagesCacheRef.current[currentTargetKey] = messagesCacheRef.current[currentTargetKey].map(m => {
                if (m.id !== msgId) return m;
                const existing = (m.reactions || []).find(r => r.userId === currentUser?.id && r.emoji === emoji);
                return {
                    ...m,
                    reactions: existing
                        ? m.reactions.filter(r => !(r.userId === currentUser?.id && r.emoji === emoji))
                        : [...(m.reactions || []), { id: `react-${Date.now()}`, emoji, userId: currentUser?.id, user: currentUser }]
                };
            });
        }

        socket?.emit(wasAdded ? "reaction:add" : "reaction:remove", {
            messageId: msgId,
            emoji,
            channelId: activeChannel?.id
        });
    }, [currentUser, socket, activeChannel?.id]);

    // 0ms Optimistic Pinning
    const handlePinMessage = useCallback((id) => {
        const targetMsg = messages.find(m => m.id === id);
        const newPinnedState = !targetMsg?.isPinned;

        setMessages(p => p.map(m => m.id === id ? { ...m, isPinned: newPinnedState } : m));
        api.post(`/api/chat/messages/${id}/pin`)
            .then(({ data }) => {
                toast.success(data.isPinned ? "Message pinned!" : "Message unpinned");
            })
            .catch(() => {
                toast.error("Failed to pin message");
                setMessages(p => p.map(m => m.id === id ? { ...m, isPinned: !newPinnedState } : m));
            });
    }, [messages]);

    // 0ms Optimistic Star Message
    const handleStarMessage = useCallback((id) => {
        const targetMsg = messages.find(m => m.id === id);
        const newStarredState = !targetMsg?.isStarred;

        setMessages(p => p.map(m => m.id === id ? { ...m, isStarred: newStarredState } : m));
        api.post(`/api/chat/messages/${id}/star`)
            .then(({ data }) => {
                toast.success(data.isStarred ? "Message starred!" : "Message unstarred");
            })
            .catch(() => {
                toast.error("Failed to star message");
                setMessages(p => p.map(m => m.id === id ? { ...m, isStarred: !newStarredState } : m));
            });
    }, [messages]);

    const handleStarChannel = useCallback((id) => {
        api.post(`/api/chat/channels/${id}/star`)
            .then(({ data }) => {
                updateUser(data.user);
                toast.success(data.isStarred ? "Channel starred!" : "Channel unstarred");
            })
            .catch(() => toast.error("Failed to star channel"));
    }, [updateUser]);

    const handleSelectSearchResult = useCallback((m) => {
        if (m.channelId) {
            const ch = channels.find(c => c.id === m.channelId);
            if (ch) handleSelectChannel(ch);
        } else if (m.recipientId) {
            const other = m.userId === currentUser.id ? m.recipient : m.user;
            if (other) handleSelectDM(other);
        }
        setSearchQuery("");
    }, [channels, currentUser, handleSelectChannel, handleSelectDM]);

    return {
        socket, isConnected, onlineUsers, currentUser, currentWorkspace, canManageChat,
        channels, setChannels, activeChannel, setActiveChannel, activeDM, setActiveDM,
        messages, setMessages, isLoadingMessages, typingUser, activeThreadMessage, setActiveThreadMessage,
        isCreateModalOpen, setIsCreateModalOpen, isBrowserOpen, setIsBrowserOpen,
        isDetailsOpen, setIsDetailsOpen, isPinnedOpen, setIsPinnedOpen, convertMsg, setConvertMsg,
        unreadChats, unreadMentions, searchQuery, setSearchQuery, searchResults,
        handleSendMessage, handlePinMessage, handleStarMessage, handleStarChannel,
        handleToggleReaction, handleSelectSearchResult, handleSelectChannel, handleSelectDM
    };
}
