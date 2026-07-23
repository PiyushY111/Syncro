import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import api from '@/configs/api';
import { useAuth } from '@/context/AuthContext';

export default function useChat() {
    const { token, user: currentUser } = useAuth();
    const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace || null);
    const isDark = useSelector((state) => state.theme?.theme === "dark");

    // Dynamic Style Colors
    const colors = {
        sidebarBg: isDark ? "#18181B" : "#F4F4F5",
        sidebarText: isDark ? "#D1D5DB" : "#27272A",
        sidebarHeaderBorder: isDark ? "#27272A" : "#E4E4E7",
        sidebarHoverBg: isDark ? "#27272A" : "#E4E4E7",
        mainBg: isDark ? "#0F0F11" : "#FFFFFF",
        mainText: isDark ? "#E4E4E7" : "#18181B",
        mainBorder: isDark ? "#27272A" : "#E4E4E7",
        streamBg: isDark ? "#161619" : "#F8FAFC",
        cardBg: isDark ? "#1E1E22" : "#FFFFFF",
        cardHoverBg: isDark ? "#2B2D31" : "#F1F5F9",
        textMuted: isDark ? "#9E9EAF" : "#64748B",
        activePill: "#4F46E5",
        activeText: "#FFFFFF",
    };

    // Sidebar states
    const [channels, setChannels] = useState([]);
    const [activeChat, setActiveChat] = useState({ type: null, id: null, name: "", isArchived: false, isPrivate: false });

    // Dialog state (Create Channel)
    const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
    const [newChannelName, setNewChannelName] = useState("");
    const [newChannelDesc, setNewChannelDesc] = useState("");
    const [newChannelIsPrivate, setNewChannelIsPrivate] = useState(false);

    // Dialog state (Browse Channels)
    const [isBrowseChannelsOpen, setIsBrowseChannelsOpen] = useState(false);
    const [browseSearchQuery, setBrowseSearchQuery] = useState("");

    // Dialog state (Edit Channel Details)
    const [isEditChannelOpen, setIsEditChannelOpen] = useState(false);
    const [editChannelName, setEditChannelName] = useState("");
    const [editChannelDesc, setEditChannelDesc] = useState("");

    // Dropdown menu state
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Invite teammate state
    const [isInviteTeammateOpen, setIsInviteTeammateOpen] = useState(false);

    // Right Sidebar controls
    const [activeRightPanel, setActiveRightPanel] = useState(null);
    const [membersSearchQuery, setMembersSearchQuery] = useState("");

    // Confirmation dialog states
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: "", targetId: "", targetName: "" });

    // Message stream states
    const [messages, setMessages] = useState([]);
    const [typedMsg, setTypedMsg] = useState("");
    const [isNotMember, setIsNotMember] = useState(false);

    // Thread states
    const [threadParent, setThreadParent] = useState(null);
    const [threadReplies, setThreadReplies] = useState([]);
    const [typedReply, setTypedReply] = useState("");

    // Scroll refs
    const chatEndRef = useRef(null);
    const threadEndRef = useRef(null);

    // Fetch workspace channels
    const fetchChannels = async () => {
        if (!currentWorkspace?.id) return;
        try {
            const { data } = await api.get(`/api/chat/workspaces/${currentWorkspace.id}/channels`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setChannels(data.channels || []);
            
            if (!activeChat.id && data.channels.length > 0) {
                const gen = data.channels.find(c => c.name === "general") || data.channels[0];
                setActiveChat({ type: "channel", id: gen.id, name: gen.name, isArchived: gen.isArchived, isPrivate: gen.isPrivate });
            } else if (activeChat.type === "channel") {
                const activeChan = data.channels.find(c => c.id === activeChat.id);
                if (activeChan) {
                    setActiveChat(prev => ({ ...prev, isArchived: activeChan.isArchived, isPrivate: activeChan.isPrivate }));
                }
            }
        } catch (error) {
            console.error("Failed to load channels:", error);
        }
    };

    // Fetch active conversation messages
    const fetchMessages = async () => {
        if (!activeChat.id) return;
        try {
            let res;
            if (activeChat.type === "channel") {
                res = await api.get(`/api/chat/channels/${activeChat.id}/messages`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                res = await api.get(`/api/chat/workspaces/${currentWorkspace.id}/direct/${activeChat.id}/messages`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setMessages(res.data.messages || []);
            setIsNotMember(false);
        } catch (error) {
            if (error.response?.status === 403 && error.response?.data?.isNotMember) {
                setIsNotMember(true);
                setMessages([]);
            } else {
                console.error("Failed to load messages:", error);
            }
        }
    };

    // Fetch active thread replies
    const fetchReplies = async () => {
        if (!threadParent?.id) return;
        try {
            const { data } = await api.get(`/api/chat/messages/${threadParent.id}/replies`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setThreadReplies(data.replies || []);
        } catch (error) {
            console.error("Failed to load replies:", error);
        }
    };

    // Create Channel handler
    const handleCreateChannel = async (e) => {
        e.preventDefault();
        if (!newChannelName.trim()) return;

        try {
            toast.loading("Creating channel...");
            const { data } = await api.post(`/api/chat/channels`, {
                name: newChannelName.trim(),
                description: newChannelDesc.trim(),
                workspaceId: currentWorkspace.id,
                isPrivate: newChannelIsPrivate
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.dismissAll();
            toast.success("Channel created successfully!");
            setChannels(prev => [...prev, data.channel]);
            setActiveChat({ type: "channel", id: data.channel.id, name: data.channel.name, isArchived: false, isPrivate: data.channel.isPrivate });
            setIsCreateChannelOpen(false);
            setNewChannelName("");
            setNewChannelDesc("");
            setNewChannelIsPrivate(false);
        } catch (error) {
            toast.dismissAll();
            toast.error(error.response?.data?.message || "Failed to create channel");
        }
    };

    // Edit Channel handler
    const handleEditChannel = async (e) => {
        e.preventDefault();
        if (!editChannelName.trim()) return;

        try {
            toast.loading("Updating details...");
            const { data } = await api.patch(`/api/chat/channels/${activeChat.id}`, {
                name: editChannelName.trim(),
                description: editChannelDesc.trim()
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.dismissAll();
            toast.success("Channel details updated!");
            setIsEditChannelOpen(false);
            setChannels(prev => prev.map(c => c.id === activeChat.id ? { ...c, name: data.channel.name, description: data.channel.description } : c));
            setActiveChat(prev => ({ ...prev, name: data.channel.name }));
        } catch (error) {
            toast.dismissAll();
            toast.error(error.response?.data?.message || "Failed to update details");
        }
    };

    // Toggle Channel Archive Status
    const handleToggleArchive = async () => {
        if (activeChat.type !== "channel" || !activeChat.id) return;
        try {
            toast.loading("Updating archive status...");
            const { data } = await api.patch(`/api/chat/channels/${activeChat.id}/archive`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.dismissAll();
            toast.success(data.message);
            setIsMenuOpen(false);
            setChannels(prev => prev.map(c => c.id === activeChat.id ? { ...c, isArchived: data.channel.isArchived } : c));
            setActiveChat(prev => ({ ...prev, isArchived: data.channel.isArchived }));
        } catch (error) {
            toast.dismissAll();
            toast.error("Failed to update archive status");
        }
    };

    // Delete Channel
    const handleDeleteChannel = async () => {
        if (activeChat.type !== "channel" || !activeChat.id) return;
        try {
            toast.loading("Deleting channel...");
            await api.delete(`/api/chat/channels/${activeChat.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.dismissAll();
            toast.success("Channel deleted successfully");
            setConfirmModal({ isOpen: false, type: "", targetId: "", targetName: "" });
            setIsMenuOpen(false);

            const remaining = channels.filter(c => c.id !== activeChat.id);
            setChannels(remaining);
            if (remaining.length > 0) {
                setActiveChat({ type: "channel", id: remaining[0].id, name: remaining[0].name, isArchived: remaining[0].isArchived, isPrivate: remaining[0].isPrivate });
            } else {
                setActiveChat({ type: null, id: null, name: "", isArchived: false, isPrivate: false });
            }
        } catch (error) {
            toast.dismissAll();
            toast.error("Failed to delete channel");
        }
    };

    // Clear DM History
    const handleClearDMs = async () => {
        if (activeChat.type !== "direct" || !activeChat.id) return;
        try {
            toast.loading("Clearing chat history...");
            await api.delete(`/api/chat/workspaces/${currentWorkspace.id}/direct/${activeChat.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.dismissAll();
            toast.success("Chat history cleared");
            setConfirmModal({ isOpen: false, type: "", targetId: "", targetName: "" });
            setIsMenuOpen(false);
            setMessages([]);
        } catch (error) {
            toast.dismissAll();
            toast.error("Failed to clear chat history");
        }
    };

    // Join public channel by active chat ID
    const handleJoinChannel = async () => {
        if (activeChat.type !== "channel" || !activeChat.id) return;
        await handleJoinChannelById(activeChat.id);
    };

    // Join public channel by specific channel ID
    const handleJoinChannelById = async (channelId) => {
        try {
            toast.loading("Joining channel...");
            await api.post(`/api/chat/channels/${channelId}/join`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.dismissAll();
            toast.success("Joined channel successfully!");
            setConfirmModal({ isOpen: false, type: "", targetId: "", targetName: "" });
            setIsBrowseChannelsOpen(false);
            
            await fetchChannels();
            const targetChan = channels.find(c => c.id === channelId) || { name: "general", isPrivate: false };
            setActiveChat({ type: "channel", id: channelId, name: targetChan.name, isArchived: false, isPrivate: targetChan.isPrivate });
            setIsNotMember(false);
            fetchMessages();
        } catch (error) {
            toast.dismissAll();
            toast.error(error.response?.data?.message || "Failed to join channel");
        }
    };

    // Copy Invite Link
    const handleCopyInviteLink = () => {
        const inviteUrl = `${window.location.origin}/chat?invite=${activeChat.id}`;
        navigator.clipboard.writeText(inviteUrl);
        toast.success("Invite link copied to clipboard!");
        setIsMenuOpen(false);
    };

    // Add organization member to channel
    const handleAddTeammate = async (memberId) => {
        try {
            toast.loading("Adding teammate...");
            await api.post(`/api/chat/channels/${activeChat.id}/members`, { memberId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.dismissAll();
            toast.success("Teammate added successfully!");
            setIsInviteTeammateOpen(false);
            fetchChannels();
        } catch (error) {
            toast.dismissAll();
            toast.error(error.response?.data?.message || "Failed to add teammate");
        }
    };

    // Send message handler
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!typedMsg.trim() || !activeChat.id || activeChat.isArchived) return;

        const payload = {
            content: typedMsg.trim(),
            channelId: activeChat.type === "channel" ? activeChat.id : null,
            recipientId: activeChat.type === "direct" ? activeChat.id : null,
        };

        try {
            const { data } = await api.post(`/api/chat/messages`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(prev => [...prev, data.message]);
            setTypedMsg("");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send message");
        }
    };

    // Send thread reply handler
    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!typedReply.trim() || !threadParent?.id || activeChat.isArchived) return;

        const payload = {
            content: typedReply.trim(),
            parentId: threadParent.id,
            channelId: activeChat.type === "channel" ? activeChat.id : null,
            recipientId: activeChat.type === "direct" ? activeChat.id : null,
        };

        try {
            const { data } = await api.post(`/api/chat/messages`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setThreadReplies(prev => [...prev, data.message]);
            setTypedReply("");
            setMessages(prev => prev.map(m => m.id === threadParent.id ? { ...m, _count: { replies: (m._count?.replies || 0) + 1 } } : m));
        } catch (error) {
            toast.error("Failed to send reply");
        }
    };

    // Auto-join from invite link URL parameter on mount
    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const inviteChanId = queryParams.get("invite");
        if (inviteChanId && token) {
            const autoJoin = async () => {
                try {
                    toast.loading("Joining channel via invite link...");
                    await api.post(`/api/chat/channels/${inviteChanId}/join`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    toast.dismissAll();
                    toast.success("Joined channel successfully!");
                    await fetchChannels();
                    setActiveChat({ type: "channel", id: inviteChanId, name: "general", isArchived: false, isPrivate: false });
                    window.history.replaceState({}, document.title, window.location.pathname);
                } catch (error) {
                    toast.dismissAll();
                    toast.error("Failed to join channel via link");
                }
            };
            autoJoin();
        }
    }, [token, currentWorkspace?.id]);

    // Initial triggers & polling loop
    useEffect(() => {
        fetchChannels();
    }, [currentWorkspace?.id]);

    useEffect(() => {
        fetchMessages();
        setThreadParent(null);
        setActiveRightPanel(null);
    }, [activeChat.id, activeChat.type]);

    useEffect(() => {
        fetchReplies();
    }, [threadParent?.id]);

    // Live polling loops
    useEffect(() => {
        if (!activeChat.id || isNotMember) return;
        const msgInterval = setInterval(() => {
            fetchMessages();
        }, 3000);
        return () => clearInterval(msgInterval);
    }, [activeChat.id, activeChat.type, isNotMember]);

    useEffect(() => {
        if (!threadParent?.id) return;
        const replyInterval = setInterval(() => {
            fetchReplies();
        }, 3000);
        return () => clearInterval(replyInterval);
    }, [threadParent?.id]);

    // Auto-scroll hooks
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [threadReplies]);

    // Members to list for direct messages
    const dmMembers = (currentWorkspace?.members || []).filter(m => m.user && m.user.id !== currentUser?.id);

    // Calculate invite candidates
    const activeChannelObj = channels.find(c => c.id === activeChat.id);
    const channelMemberIds = activeChannelObj?.members?.map(m => m.id) || [];
    
    // Channel members currently joined
    const joinedChannelMembers = activeChannelObj?.members || [];
    const filteredChannelMembers = joinedChannelMembers.filter(m => 
        m.name.toLowerCase().includes(membersSearchQuery.toLowerCase())
    );

    const inviteCandidates = (currentWorkspace?.members || [])
        .filter(m => m.user && m.user.id !== currentUser?.id && !channelMemberIds.includes(m.user.id));

    // Permission checks to edit channel details
    const canEditChannel = activeChat.type === "channel" && (
        activeChannelObj?.creatorId === currentUser?.id || 
        currentWorkspace?.ownerId === currentUser?.id
    );

    // Filter public channels in workspace for browse search dialog
    const publicChannels = channels.filter(c => !c.isPrivate);
    const filteredPublicChannels = publicChannels.filter(c => 
        c.name.toLowerCase().includes(browseSearchQuery.toLowerCase())
    );

    return {
        currentUser,
        currentWorkspace,
        isDark,
        colors,
        channels,
        activeChat,
        setActiveChat,
        isCreateChannelOpen,
        setIsCreateChannelOpen,
        newChannelName,
        setNewChannelName,
        newChannelDesc,
        setNewChannelDesc,
        newChannelIsPrivate,
        setNewChannelIsPrivate,
        isBrowseChannelsOpen,
        setIsBrowseChannelsOpen,
        browseSearchQuery,
        setBrowseSearchQuery,
        isEditChannelOpen,
        setIsEditChannelOpen,
        editChannelName,
        setEditChannelName,
        editChannelDesc,
        setEditChannelDesc,
        isMenuOpen,
        setIsMenuOpen,
        isInviteTeammateOpen,
        setIsInviteTeammateOpen,
        activeRightPanel,
        setActiveRightPanel,
        membersSearchQuery,
        setMembersSearchQuery,
        confirmModal,
        setConfirmModal,
        messages,
        typedMsg,
        setTypedMsg,
        isNotMember,
        threadParent,
        setThreadParent,
        threadReplies,
        typedReply,
        setTypedReply,
        chatEndRef,
        threadEndRef,
        handleCreateChannel,
        handleEditChannel,
        handleToggleArchive,
        handleDeleteChannel,
        handleClearDMs,
        handleJoinChannel,
        handleJoinChannelById,
        handleCopyInviteLink,
        handleAddTeammate,
        handleSendMessage,
        handleSendReply,
        dmMembers,
        activeChannelObj,
        joinedChannelMembers,
        filteredChannelMembers,
        inviteCandidates,
        canEditChannel,
        filteredPublicChannels
    };
}
