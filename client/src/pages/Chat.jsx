import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { MessageSquare, Plus, Send, X, Hash, User, CornerDownRight, Settings, Trash2, Archive, HelpCircle, Link, UserPlus, Lock, Edit, Search, Users, Check } from "lucide-react";
import toast from "react-hot-toast";
import api from "../configs/api";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";

export default function Chat() {
    const { token, user: currentUser } = useAuth();
    const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace || null);
    const isDark = useSelector((state) => state.theme?.theme === "dark");

    // Dynamic Style Colors (Light / Dark Mode Adaptive)
    const colors = {
        sidebarBg: isDark ? "#18181B" : "#F4F4F5", // Slate/Zinc adaptive sidebar
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
        activePill: "#4F46E5", // Indigo-600
        activeText: "#FFFFFF",
    };

    // Sidebar states
    const [channels, setChannels] = useState([]);
    const [activeChat, setActiveChat] = useState({ type: null, id: null, name: "", isArchived: false, isPrivate: false }); // type: "channel" | "direct"

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

    // Dropdown options menu state
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Invite teammate state
    const [isInviteTeammateOpen, setIsInviteTeammateOpen] = useState(false);

    // Right Sidebar controls (replacing threadParent direct checks)
    const [activeRightPanel, setActiveRightPanel] = useState(null); // null | "thread" | "members"
    const [membersSearchQuery, setMembersSearchQuery] = useState("");

    // Confirmation dialog states
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: "", targetId: "", targetName: "" }); // type: "delete_channel" | "clear_dm" | "join_channel"

    // Message stream states
    const [messages, setMessages] = useState([]);
    const [typedMsg, setTypedMsg] = useState("");
    const [isNotMember, setIsNotMember] = useState(false); // Lock message logs if not joined public/private channel

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
            
            // Set default active channel if none active
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
            
            // Sync channels state
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
            
            // Sync channels list and active chat
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

            // Filter out deleted channel
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
            
            // Re-sync local states
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

    // Copy Channel Invite Link
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

    // Members to list for direct messages (all workspace members except current user)
    const dmMembers = (currentWorkspace?.members || []).filter(m => m.user && m.user.id !== currentUser?.id);

    // Calculate invite candidates (workspace members not in active channel)
    const activeChannelObj = channels.find(c => c.id === activeChat.id);
    const channelMemberIds = activeChannelObj?.members?.map(m => m.id) || [];
    
    // Channel members currently joined
    const joinedChannelMembers = activeChannelObj?.members || [];
    const filteredChannelMembers = joinedChannelMembers.filter(m => 
        m.name.toLowerCase().includes(membersSearchQuery.toLowerCase())
    );

    const inviteCandidates = (currentWorkspace?.members || [])
        .filter(m => m.user && m.user.id !== currentUser?.id && !channelMemberIds.includes(m.user.id));

    // Permission checks to edit channel details (creator or workspace owner)
    const canEditChannel = activeChat.type === "channel" && (
        activeChannelObj?.creatorId === currentUser?.id || 
        currentWorkspace?.ownerId === currentUser?.id
    );

    // Filter public channels in workspace for browse search dialog
    const publicChannels = channels.filter(c => !c.isPrivate);
    const filteredPublicChannels = publicChannels.filter(c => 
        c.name.toLowerCase().includes(browseSearchQuery.toLowerCase())
    );

    return (
        <div 
            className="flex border rounded-2xl overflow-hidden h-[82vh] max-w-6xl mx-auto shadow-md"
            style={{ backgroundColor: colors.mainBg, borderColor: colors.mainBorder }}
        >
            {/* Sidebar (Theme-sensitive color configuration) */}
            <div 
                className="w-64 flex flex-col flex-shrink-0 transition-colors duration-150"
                style={{ backgroundColor: colors.sidebarBg, color: colors.sidebarText }}
            >
                {/* Header */}
                <div 
                    className="p-4 border-b flex items-center justify-between"
                    style={{ borderBottomColor: colors.sidebarHeaderBorder }}
                >
                    <h3 className="font-bold flex items-center gap-2 text-sm tracking-tight" style={{ color: colors.sidebarText }}>
                        <MessageSquare className="size-4.5 text-indigo-500" /> Workspace Chat
                    </h3>
                </div>

                {/* Lists */}
                <div className="flex-1 overflow-y-auto p-3 space-y-6 no-scrollbar">
                    {/* Channels */}
                    <div>
                        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider mb-2 px-2" style={{ color: colors.textMuted }}>
                            <span>Channels</span>
                            <div className="flex items-center gap-1.5">
                                <button 
                                    onClick={() => { setIsBrowseChannelsOpen(true); setBrowseSearchQuery(""); }} 
                                    className="transition-colors p-0.5 rounded cursor-pointer hover:text-white" 
                                    style={{ color: colors.sidebarText }}
                                    title="Search Public Channels"
                                >
                                    <Search className="size-3.5" />
                                </button>
                                <button 
                                    onClick={() => setIsCreateChannelOpen(true)} 
                                    className="transition-colors p-0.5 rounded cursor-pointer hover:text-white" 
                                    style={{ color: colors.sidebarText }}
                                    title="Create Channel"
                                >
                                    <Plus className="size-4" />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-0.5">
                            {channels.map((chan) => {
                                const isActive = activeChat.type === "channel" && activeChat.id === chan.id;
                                return (
                                    <button
                                        key={chan.id}
                                        onClick={() => {
                                            setActiveChat({ type: "channel", id: chan.id, name: chan.name, isArchived: chan.isArchived, isPrivate: chan.isPrivate });
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-md text-sm text-left transition-all cursor-pointer hover:opacity-95"
                                        style={isActive ? {
                                            backgroundColor: colors.activePill,
                                            color: colors.activeText,
                                            fontWeight: "500"
                                        } : {
                                            color: colors.sidebarText,
                                            backgroundColor: "transparent"
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isActive) e.currentTarget.style.backgroundColor = colors.sidebarHoverBg;
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                                        }}
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            {chan.isPrivate ? (
                                                <Lock className={`size-3.5 flex-shrink-0 ${isActive ? "text-indigo-200" : "text-zinc-500"}`} />
                                            ) : (
                                                <Hash className={`size-4 flex-shrink-0 ${isActive ? "text-indigo-200" : "text-zinc-500"}`} />
                                            )}
                                            <span className="truncate">{chan.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {chan.isArchived && (
                                                <span className="text-[9px] px-1 bg-zinc-800 text-zinc-400 dark:bg-zinc-700 dark:text-zinc-200 rounded border border-zinc-700 uppercase scale-90">Arch</span>
                                            )}
                                            {chan.isPrivate && (
                                                <span className="text-[9px] px-1 bg-indigo-950 text-indigo-300 rounded border border-indigo-900 uppercase scale-90">Priv</span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Direct Messages */}
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
                                        style={isActive ? {
                                            backgroundColor: colors.activePill,
                                            color: colors.activeText,
                                            fontWeight: "500"
                                        } : {
                                            color: colors.sidebarText,
                                            backgroundColor: "transparent"
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isActive) e.currentTarget.style.backgroundColor = colors.sidebarHoverBg;
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                                        }}
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
                </div>
            </div>

            {/* Center Panel (Main Chat View) */}
            <div 
                className="flex-1 flex flex-col relative"
                style={{ backgroundColor: colors.mainBg }}
            >
                {activeChat.id ? (
                    <>
                        {/* Header */}
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
                                {/* Member count shortcut (Clicking toggles members Right Sidebar panel) */}
                                {activeChat.type === "channel" && (
                                    <button 
                                        onClick={() => {
                                            setActiveRightPanel(prev => prev === "members" ? null : "members");
                                            setMembersSearchQuery("");
                                        }}
                                        className="flex items-center gap-1 text-[11px] font-medium hover:underline mt-0.5 text-left w-fit"
                                        style={{ color: colors.textMuted }}
                                    >
                                        <Users className="size-3" /> {joinedChannelMembers.length} member{joinedChannelMembers.length === 1 ? "" : "s"}
                                    </button>
                                )}
                            </div>

                            {/* Dropdown triggers (Only show settings gear if the user is a member/joined) */}
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
                                                        <Archive className="size-3.5 text-amber-500" /> {activeChat.isArchived ? "Archive Channel" : "Archive Channel"}
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

                        {/* Archive Warning Banner */}
                        {activeChat.isArchived && (
                            <div className="bg-amber-100/50 dark:bg-amber-950/20 border-b border-amber-300 dark:border-amber-900 p-3 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-400">
                                <HelpCircle className="size-4 text-amber-500 flex-shrink-0" />
                                <span>This channel has been archived. Posting new messages is locked.</span>
                            </div>
                        )}

                        {/* Messages Stream / Join Wall Switch */}
                        {isNotMember ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center" style={{ backgroundColor: colors.streamBg }}>
                                <div className="size-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center mb-4">
                                    <Hash className="size-8 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                                </div>
                                <h3 className="text-lg font-bold" style={{ color: colors.mainText }}>You are viewing #{activeChat.name}</h3>
                                <p className="text-sm max-w-sm mt-2" style={{ color: colors.textMuted }}>
                                    This is a public channel. Join it to view the message history, read threads, and post messages.
                                </p>
                                <button
                                    onClick={handleJoinChannel}
                                    className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-6 py-2.5 rounded-xl shadow transition cursor-pointer"
                                >
                                    Join Channel
                                </button>
                            </div>
                        ) : (
                            <>
                                <div 
                                    className="flex-1 overflow-y-auto p-5 space-y-5"
                                    style={{ backgroundColor: colors.streamBg }}
                                >
                                    {messages.length > 0 ? (
                                        messages.map((msg) => {
                                            if (msg.type === "SYSTEM") {
                                                return (
                                                    <div key={msg.id} className="flex justify-center my-3.5">
                                                        <span 
                                                            className="text-[11px] px-3 py-1.5 rounded-full border flex items-center gap-1.5 shadow-xs"
                                                            style={{ 
                                                                backgroundColor: isDark ? "#1E1E22" : "#F1F5F9", 
                                                                borderColor: colors.mainBorder,
                                                                color: colors.textMuted
                                                            }}
                                                        >
                                                            👋 {msg.content}
                                                        </span>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div 
                                                    key={msg.id} 
                                                    className="group flex items-start gap-3 p-2.5 rounded-lg transition-colors hover:bg-slate-200/40 dark:hover:bg-zinc-800/30"
                                                >
                                                    {msg.user?.image ? (
                                                        <img src={msg.user.image} className="size-8.5 rounded-full object-cover mt-0.5" alt="avatar" />
                                                    ) : (
                                                        <div className="size-8.5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm mt-0.5">
                                                            {msg.user?.name ? msg.user.name.charAt(0).toUpperCase() : "?"}
                                                        </div>
                                                    )}

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span 
                                                                className="font-semibold text-sm"
                                                                style={{ color: colors.mainText }}
                                                            >
                                                                {msg.user?.name || "Unknown user"}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400">
                                                                {format(new Date(msg.createdAt), "hh:mm a")}
                                                            </span>
                                                        </div>
                                                        <p 
                                                            className="text-sm mt-1 leading-relaxed whitespace-pre-wrap"
                                                            style={{ color: colors.mainText }}
                                                        >
                                                            {msg.content}
                                                        </p>
                                                        
                                                        {/* Thread actions */}
                                                        <div className="flex items-center gap-3 mt-2">
                                                            <button
                                                                onClick={() => {
                                                                    setThreadParent(msg);
                                                                    setActiveRightPanel("thread");
                                                                }}
                                                                className="text-xs text-indigo-500 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                                                            >
                                                                <CornerDownRight className="size-3" /> Reply in Thread
                                                            </button>
                                                            {msg._count?.replies > 0 && (
                                                                <span 
                                                                    className="text-[11px] font-medium px-1.5 py-0.5 rounded"
                                                                    style={{ backgroundColor: isDark ? "#27272A" : "#E4E4E7", color: colors.textMuted }}
                                                                >
                                                                    {msg._count.replies} repl{msg._count.replies === 1 ? "y" : "ies"}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
                                            <MessageSquare className="size-14 mb-3 text-zinc-500" />
                                            <p className="text-sm">This is the start of your message history with {activeChat.name}.</p>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Input Box */}
                                <form 
                                    onSubmit={handleSendMessage} 
                                    className="p-4 border-t flex gap-2"
                                    style={{ borderColor: colors.mainBorder }}
                                >
                                    <input
                                        type="text"
                                        value={typedMsg}
                                        onChange={(e) => setTypedMsg(e.target.value)}
                                        disabled={activeChat.isArchived}
                                        placeholder={activeChat.isArchived ? "Channel is archived" : `Send a message to ${activeChat.type === "channel" ? "#" + activeChat.name : activeChat.name}`}
                                        className="flex-1 rounded border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                                        style={{
                                            backgroundColor: isDark ? "#18181B" : "#FFFFFF",
                                            color: colors.mainText,
                                            borderColor: colors.mainBorder
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!typedMsg.trim() || activeChat.isArchived}
                                        className="bg-indigo-600 text-white p-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
                                    >
                                        <Send className="size-4" />
                                    </button>
                                </form>
                            </>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8">
                        <MessageSquare className="size-16 mb-4 text-zinc-300 dark:text-zinc-700" />
                        <p 
                            className="text-base font-semibold"
                            style={{ color: colors.mainText }}
                        >
                            No Active Conversation
                        </p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Select a group channel or team member to get started!</p>
                    </div>
                )}
            </div>

            {/* Right Panel (Adaptive Thread Sidebar or Members Sidebar) */}
            {activeRightPanel && (
                <div 
                    className="w-80 border-l flex flex-col flex-shrink-0 animate-in slide-in-from-right duration-150"
                    style={{ backgroundColor: colors.mainBg, borderColor: colors.mainBorder }}
                >
                    {/* Render Thread Replies Sidebar */}
                    {activeRightPanel === "thread" && threadParent && (
                        <>
                            {/* Thread Header */}
                            <div 
                                className="p-4 border-b flex items-center justify-between"
                                style={{ borderColor: colors.mainBorder }}
                            >
                                <h4 className="font-bold text-sm" style={{ color: colors.mainText }}>
                                    Thread replies
                                </h4>
                                <button 
                                    onClick={() => { setActiveRightPanel(null); setThreadParent(null); }} 
                                    className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            {/* Parent Message details */}
                            <div 
                                className="p-4 border-b flex items-start gap-3"
                                style={{ backgroundColor: isDark ? "#1E1E22" : "#F8FAFC", borderColor: colors.mainBorder }}
                            >
                                {threadParent.user?.image ? (
                                    <img src={threadParent.user.image} className="size-8 rounded-full object-cover mt-0.5" alt="avatar" />
                                ) : (
                                    <div className="size-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs mt-0.5">
                                        {threadParent.user?.name ? threadParent.user.name.charAt(0).toUpperCase() : "?"}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <span className="font-semibold text-xs" style={{ color: colors.mainText }}>
                                        {threadParent.user?.name || "Unknown user"}
                                    </span>
                                    <p className="text-xs mt-1 leading-relaxed whitespace-pre-wrap" style={{ color: colors.mainText }}>
                                        {threadParent.content}
                                    </p>
                                </div>
                            </div>

                            {/* Replies Stream */}
                            <div 
                                className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar"
                                style={{ backgroundColor: colors.streamBg }}
                            >
                                {threadReplies.map((reply) => (
                                    <div key={reply.id} className="flex items-start gap-2.5 p-2 rounded hover:bg-slate-200/30 dark:hover:bg-zinc-800/20">
                                        {reply.user?.image ? (
                                            <img src={reply.user.image} className="size-6.5 rounded-full object-cover mt-0.5" alt="avatar" />
                                        ) : (
                                            <div className="size-6.5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-[10px] mt-0.5">
                                                {reply.user?.name ? reply.user.name.charAt(0).toUpperCase() : "?"}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-semibold text-xs" style={{ color: colors.mainText }}>
                                                    {reply.user?.name || "Unknown user"}
                                                </span>
                                                <span className="text-[9px] text-gray-400">{format(new Date(reply.createdAt), "hh:mm a")}</span>
                                            </div>
                                            <p className="text-xs mt-0.5 leading-relaxed whitespace-pre-wrap" style={{ color: colors.mainText }}>
                                                {reply.content}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={threadEndRef} />
                            </div>

                            {/* Reply Input Box */}
                            <form 
                                onSubmit={handleSendReply} 
                                className="p-3 border-t flex gap-1.5"
                                style={{ borderColor: colors.mainBorder }}
                            >
                                <input
                                    type="text"
                                    value={typedReply}
                                    onChange={(e) => setTypedReply(e.target.value)}
                                    disabled={activeChat.isArchived}
                                    placeholder={activeChat.isArchived ? "Archived" : "Reply..."}
                                    className="flex-1 rounded border px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                                    style={{
                                        backgroundColor: isDark ? "#18181B" : "#FFFFFF",
                                        color: colors.mainText,
                                        borderColor: colors.mainBorder
                                    }}
                                />
                                <button 
                                    type="submit" 
                                    disabled={!typedReply.trim() || activeChat.isArchived} 
                                    className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
                                >
                                    <Send className="size-3.5" />
                                </button>
                            </form>
                        </>
                    )}

                    {/* Render Channel Members Sidebar */}
                    {activeRightPanel === "members" && (
                        <>
                            {/* Members Header */}
                            <div 
                                className="p-4 border-b flex items-center justify-between"
                                style={{ borderColor: colors.mainBorder }}
                            >
                                <h4 className="font-bold text-sm" style={{ color: colors.mainText }}>
                                    Channel Members ({joinedChannelMembers.length})
                                </h4>
                                <button 
                                    onClick={() => setActiveRightPanel(null)} 
                                    className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            {/* Members search search bar */}
                            <div className="p-3 border-b" style={{ borderColor: colors.mainBorder }}>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
                                    <input
                                        type="text"
                                        value={membersSearchQuery}
                                        onChange={(e) => setMembersSearchQuery(e.target.value)}
                                        placeholder="Search members..."
                                        className="w-full text-xs pl-8 pr-3 py-1.5 rounded border focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        style={{
                                            backgroundColor: isDark ? "#18181B" : "#FFFFFF",
                                            color: colors.mainText,
                                            borderColor: colors.mainBorder
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Members List Stream */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 no-scrollbar" style={{ backgroundColor: colors.streamBg }}>
                                {filteredChannelMembers.length > 0 ? (
                                    filteredChannelMembers.map((member) => {
                                        const isCreator = activeChannelObj?.creatorId === member.id;
                                        const isOwner = currentWorkspace?.ownerId === member.id;
                                        return (
                                            <div 
                                                key={member.id} 
                                                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-200/35 dark:hover:bg-zinc-800/10 border border-transparent"
                                            >
                                                {member.image ? (
                                                    <img src={member.image} className="size-7 rounded-full object-cover" alt="avatar" />
                                                ) : (
                                                    <div className="size-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs">
                                                        {member.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-semibold text-xs truncate" style={{ color: colors.mainText }}>
                                                            {member.name}
                                                        </span>
                                                        {member.id === currentUser?.id && (
                                                            <span className="text-[8px] bg-slate-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 px-1 rounded-sm">you</span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                                        {isOwner && (
                                                            <span className="text-[7.5px] px-1 bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 rounded-xs uppercase tracking-wide font-bold">Owner</span>
                                                        )}
                                                        {isCreator && (
                                                            <span className="text-[7.5px] px-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-xs uppercase tracking-wide font-bold">Creator</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-xs text-zinc-500 text-center py-8">No members found</p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Browse Channels Dialog Modal */}
            {isBrowseChannelsOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/75 backdrop-blur-xs">
                    <div 
                        className="border rounded-xl shadow-lg w-full max-w-md p-6 animate-in zoom-in-95 duration-100 flex flex-col max-h-[70vh]"
                        style={{ backgroundColor: colors.cardBg, borderColor: colors.mainBorder }}
                    >
                        <div className="flex items-center justify-between mb-4 flex-shrink-0">
                            <h2 className="text-lg font-bold" style={{ color: colors.mainText }}>Browse Public Channels</h2>
                            <button onClick={() => setIsBrowseChannelsOpen(false)} className="text-gray-400 hover:text-red-500 cursor-pointer">
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Search Input bar */}
                        <div className="relative mb-4 flex-shrink-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                            <input
                                type="text"
                                value={browseSearchQuery}
                                onChange={(e) => setBrowseSearchQuery(e.target.value)}
                                placeholder="Search by channel name..."
                                className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                style={{
                                    backgroundColor: isDark ? "#18181B" : "#FFFFFF",
                                    color: colors.mainText,
                                    borderColor: colors.mainBorder
                                }}
                            />
                        </div>

                        {/* Public Channels List */}
                        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 no-scrollbar">
                            {filteredPublicChannels.length > 0 ? (
                                filteredPublicChannels.map((chan) => {
                                    const isJoined = chan.members?.some(m => m.id === currentUser?.id) || chan.creatorId === currentUser?.id;
                                    return (
                                        <div 
                                            key={chan.id} 
                                            className="flex items-center justify-between p-3 rounded-xl border transition hover:bg-slate-50 dark:hover:bg-zinc-800/10"
                                            style={{ borderColor: colors.mainBorder }}
                                        >
                                            <div className="min-w-0 flex-1 pr-3">
                                                <div className="flex items-center gap-1.5">
                                                    <Hash className="size-4 text-zinc-400 flex-shrink-0" />
                                                    <span className="text-sm font-semibold truncate" style={{ color: colors.mainText }}>
                                                        {chan.name}
                                                    </span>
                                                    {isJoined && (
                                                        <span className="text-[8.5px] px-1 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded flex items-center gap-0.5">
                                                            <Check className="size-2.5" /> Joined
                                                        </span>
                                                    )}
                                                </div>
                                                {chan.description && (
                                                    <p className="text-xs truncate mt-0.5" style={{ color: colors.textMuted }}>
                                                        {chan.description}
                                                    </p>
                                                )}
                                                <p className="text-[10px] mt-1 font-medium" style={{ color: colors.textMuted }}>
                                                    {chan.members?.length || 0} member{chan.members?.length === 1 ? "" : "s"}
                                                </p>
                                            </div>
                                            
                                            {!isJoined ? (
                                                <button
                                                    onClick={() => setConfirmModal({ isOpen: true, type: "join_channel", targetId: chan.id, targetName: chan.name })}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition flex-shrink-0"
                                                >
                                                    Join
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setActiveChat({ type: "channel", id: chan.id, name: chan.name, isArchived: chan.isArchived, isPrivate: chan.isPrivate });
                                                        setIsBrowseChannelsOpen(false);
                                                    }}
                                                    className="border text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition flex-shrink-0 hover:bg-slate-100 dark:hover:bg-zinc-800"
                                                    style={{ color: colors.mainText, borderColor: colors.mainBorder }}
                                                >
                                                    View
                                                </button>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-10 text-zinc-500">
                                    <MessageSquare className="size-10 mx-auto mb-2 text-zinc-400" />
                                    <p className="text-xs">No public channels found matching "{browseSearchQuery}"</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Channel Dialog Modal */}
            {isCreateChannelOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/75 backdrop-blur-xs">
                    <div 
                        className="border rounded-xl shadow-lg w-full max-w-sm p-6 animate-in zoom-in-95 duration-100"
                        style={{ backgroundColor: colors.cardBg, borderColor: colors.mainBorder }}
                    >
                        <h2 
                            className="text-lg font-bold mb-4"
                            style={{ color: colors.mainText }}
                        >
                            Create Group Channel
                        </h2>
                        <form onSubmit={handleCreateChannel} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500">Channel Name</label>
                                <input
                                    value={newChannelName}
                                    onChange={(e) => setNewChannelName(e.target.value)}
                                    placeholder="e.g. general"
                                    className="w-full rounded border px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    style={{
                                        backgroundColor: isDark ? "#18181B" : "#FFFFFF",
                                        color: colors.mainText,
                                        borderColor: colors.mainBorder
                                    }}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500">Description (Optional)</label>
                                <input
                                    value={newChannelDesc}
                                    onChange={(e) => setNewChannelDesc(e.target.value)}
                                    placeholder="Brief details about discussions"
                                    className="w-full rounded border px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    style={{
                                        backgroundColor: isDark ? "#18181B" : "#FFFFFF",
                                        color: colors.mainText,
                                        borderColor: colors.mainBorder
                                    }}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500">Channel Visibility</label>
                                <div className="flex gap-4 mt-2">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input
                                            type="radio"
                                            name="channelType"
                                            checked={!newChannelIsPrivate}
                                            onChange={() => setNewChannelIsPrivate(false)}
                                            className="accent-indigo-600"
                                        />
                                        <span style={{ color: colors.mainText }}>Public</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input
                                            type="radio"
                                            name="channelType"
                                            checked={newChannelIsPrivate}
                                            onChange={() => setNewChannelIsPrivate(true)}
                                            className="accent-indigo-600"
                                        />
                                        <span style={{ color: colors.mainText }}>Private</span>
                                    </label>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">
                                    {newChannelIsPrivate 
                                        ? "Private channels are only visible to workspace owners, creators, and invited members." 
                                        : "Public channels are visible to all workspace members, but require joining to view histories."}
                                </p>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button 
                                    type="button" 
                                    onClick={() => setIsCreateChannelOpen(false)} 
                                    className="rounded border px-4 py-2 text-xs hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                                    style={{ color: colors.mainText, borderColor: colors.mainBorder }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={!newChannelName.trim()} 
                                    className="rounded px-4 py-2 text-xs bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer"
                                >
                                    Create Channel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Channel Details Dialog Modal */}
            {isEditChannelOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/75 backdrop-blur-xs">
                    <div 
                        className="border rounded-xl shadow-lg w-full max-w-sm p-6 animate-in zoom-in-95 duration-100"
                        style={{ backgroundColor: colors.cardBg, borderColor: colors.mainBorder }}
                    >
                        <h2 
                            className="text-lg font-bold mb-4"
                            style={{ color: colors.mainText }}
                        >
                            Edit Channel Details
                        </h2>
                        <form onSubmit={handleEditChannel} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500">Channel Name</label>
                                <input
                                    value={editChannelName}
                                    onChange={(e) => setEditChannelName(e.target.value)}
                                    placeholder="e.g. general"
                                    className="w-full rounded border px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    style={{
                                        backgroundColor: isDark ? "#18181B" : "#FFFFFF",
                                        color: colors.mainText,
                                        borderColor: colors.mainBorder
                                    }}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500">Description (Optional)</label>
                                <input
                                    value={editChannelDesc}
                                    onChange={(e) => setEditChannelDesc(e.target.value)}
                                    placeholder="Brief details about discussions"
                                    className="w-full rounded border px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    style={{
                                        backgroundColor: isDark ? "#18181B" : "#FFFFFF",
                                        color: colors.mainText,
                                        borderColor: colors.mainBorder
                                    }}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button 
                                    type="button" 
                                    onClick={() => setIsEditChannelOpen(false)} 
                                    className="rounded border px-4 py-2 text-xs hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                                    style={{ color: colors.mainText, borderColor: colors.mainBorder }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={!editChannelName.trim()} 
                                    className="rounded px-4 py-2 text-xs bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Invite Teammates Dialog Modal */}
            {isInviteTeammateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/75 backdrop-blur-xs">
                    <div 
                        className="border rounded-xl shadow-lg w-full max-w-sm p-6 animate-in zoom-in-95 duration-100"
                        style={{ backgroundColor: colors.cardBg, borderColor: colors.mainBorder }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 
                                className="text-base font-bold"
                                style={{ color: colors.mainText }}
                            >
                                Invite Teammates to #{activeChat.name}
                            </h2>
                            <button onClick={() => setIsInviteTeammateOpen(false)} className="text-gray-400 hover:text-red-500 cursor-pointer">
                                <X className="size-4" />
                            </button>
                        </div>
                        
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                            {inviteCandidates.length > 0 ? (
                                inviteCandidates.map((candidate) => (
                                    <div 
                                        key={candidate.user.id} 
                                        className="flex items-center justify-between p-2.5 rounded-lg border"
                                        style={{ borderColor: colors.mainBorder }}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            {candidate.user.image ? (
                                                <img src={candidate.user.image} className="size-6.5 rounded-full object-cover" alt="avatar" />
                                            ) : (
                                                <div className="size-6.5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
                                                    {candidate.user.name[0].toUpperCase()}
                                                </div>
                                            )}
                                            <span className="text-xs truncate font-medium" style={{ color: colors.mainText }}>
                                                {candidate.user.name}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleAddTeammate(candidate.user.id)}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-semibold px-2.5 py-1 rounded cursor-pointer transition"
                                        >
                                            Add
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-zinc-500 text-center py-4">All workspace members are already in this channel.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Confirmation Modals */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/75 backdrop-blur-xs">
                    <div 
                        className="border rounded-xl shadow-lg w-full max-w-sm p-6 animate-in zoom-in-95 duration-100"
                        style={{ backgroundColor: colors.cardBg, borderColor: colors.mainBorder }}
                    >
                        <h2 className="text-lg font-bold mb-2 text-red-600 dark:text-red-500 flex items-center gap-2">
                            {confirmModal.type === "join_channel" ? (
                                <Users className="size-5 text-indigo-600 dark:text-indigo-400" />
                            ) : (
                                <Trash2 className="size-5 text-red-600" />
                            )}
                            {confirmModal.type === "join_channel" ? "Join Public Channel" : "Danger Action"}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-zinc-400 mb-4">
                            {confirmModal.type === "delete_channel" 
                                ? `Are you sure you want to delete the channel "#${confirmModal.targetName}"? This will permanently delete the channel and all its messages. This cannot be undone.` 
                                : confirmModal.type === "clear_dm" 
                                ? `Are you sure you want to clear chat history with "${confirmModal.targetName}"? All direct messages will be deleted forever.`
                                : `Would you like to join the public channel "#${confirmModal.targetName}"? You will be added to the channel members list.`}
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setConfirmModal({ isOpen: false, type: "", targetId: "", targetName: "" })}
                                className="rounded border px-4 py-2 text-xs hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                                style={{ color: colors.mainText, borderColor: colors.mainBorder }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={
                                    confirmModal.type === "delete_channel" 
                                        ? handleDeleteChannel 
                                        : confirmModal.type === "clear_dm" 
                                        ? handleClearDMs 
                                        : () => handleJoinChannelById(confirmModal.targetId)
                                }
                                className="rounded px-4 py-2 text-xs text-white transition cursor-pointer font-medium"
                                style={{ backgroundColor: confirmModal.type === "join_channel" ? colors.activePill : "#DC2626" }}
                            >
                                {confirmModal.type === "join_channel" ? "Join Channel" : confirmModal.type === "delete_channel" ? "Delete Channel" : "Clear Chat"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
