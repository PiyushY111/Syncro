import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import api from '@/configs/api';
import { useAuth } from '@/context/AuthContext';
import { useChatChannels } from './useChatChannels';
import { useChatMessages } from './useChatMessages';

export default function useChat() {
    const { token, user: currentUser } = useAuth();
    const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace || null);
    const isDark = useSelector((state) => state.theme?.theme === "dark");

    const colors = {
        sidebarBg: isDark ? "#18181B" : "#F4F4F5", sidebarText: isDark ? "#D1D5DB" : "#27272A",
        sidebarHeaderBorder: isDark ? "#27272A" : "#E4E4E7", sidebarHoverBg: isDark ? "#27272A" : "#E4E4E7",
        mainBg: isDark ? "#0F0F11" : "#FFFFFF", mainText: isDark ? "#E4E4E7" : "#18181B",
        mainBorder: isDark ? "#27272A" : "#E4E4E7", streamBg: isDark ? "#161619" : "#F8FAFC",
        cardBg: isDark ? "#1E1E22" : "#FFFFFF", cardHoverBg: isDark ? "#2B2D31" : "#F1F5F9",
        textMuted: isDark ? "#9E9EAF" : "#64748B", activePill: "#4F46E5", activeText: "#FFFFFF",
    };

    const [activeChat, setActiveChat] = useState({ type: null, id: null, name: "", isArchived: false, isPrivate: false });
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isInviteTeammateOpen, setIsInviteTeammateOpen] = useState(false);
    const [activeRightPanel, setActiveRightPanel] = useState(null);
    const [membersSearchQuery, setMembersSearchQuery] = useState("");
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: "", targetId: "", targetName: "" });

    const channelHook = useChatChannels(token, currentWorkspace, activeChat, setActiveChat);
    const messageHook = useChatMessages(token, currentWorkspace, activeChat);
    const { channels, fetchChannels, setChannels } = channelHook;
    const { fetchMessages, fetchReplies, setMessages, setIsNotMember, setThreadParent } = messageHook;

    const handleEditChannel = async (e) => {
        e.preventDefault();
        if (!channelHook.editChannelName.trim()) return;
        try {
            toast.loading("Updating details...");
            const { data } = await api.patch(`/api/chat/channels/${activeChat.id}`, { name: channelHook.editChannelName.trim(), description: channelHook.editChannelDesc.trim() }, { headers: { Authorization: `Bearer ${token}` } });
            toast.dismissAll(); toast.success("Channel details updated!"); channelHook.setIsEditChannelOpen(false);
            setChannels(prev => prev.map(c => c.id === activeChat.id ? { ...c, name: data.channel.name, description: data.channel.description } : c));
            setActiveChat(prev => ({ ...prev, name: data.channel.name }));
        } catch (err) { toast.dismissAll(); toast.error(err.response?.data?.message || "Failed to update details"); }
    };

    const handleToggleArchive = async () => {
        if (activeChat.type !== "channel" || !activeChat.id) return;
        try {
            toast.loading("Updating archive status...");
            const { data } = await api.patch(`/api/chat/channels/${activeChat.id}/archive`, {}, { headers: { Authorization: `Bearer ${token}` } });
            toast.dismissAll(); toast.success(data.message); setIsMenuOpen(false);
            setChannels(prev => prev.map(c => c.id === activeChat.id ? { ...c, isArchived: data.channel.isArchived } : c));
            setActiveChat(prev => ({ ...prev, isArchived: data.channel.isArchived }));
        } catch { toast.dismissAll(); toast.error("Failed to update archive status"); }
    };

    const handleDeleteChannel = async () => {
        if (activeChat.type !== "channel" || !activeChat.id) return;
        try {
            toast.loading("Deleting channel...");
            await api.delete(`/api/chat/channels/${activeChat.id}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.dismissAll(); toast.success("Channel deleted successfully"); setConfirmModal({ isOpen: false, type: "", targetId: "", targetName: "" }); setIsMenuOpen(false);
            const remaining = channels.filter(c => c.id !== activeChat.id); setChannels(remaining);
            if (remaining.length > 0) setActiveChat({ type: "channel", id: remaining[0].id, name: remaining[0].name, isArchived: remaining[0].isArchived, isPrivate: remaining[0].isPrivate });
            else setActiveChat({ type: null, id: null, name: "", isArchived: false, isPrivate: false });
        } catch { toast.dismissAll(); toast.error("Failed to delete channel"); }
    };

    const handleClearDMs = async () => {
        if (activeChat.type !== "direct" || !activeChat.id) return;
        try {
            toast.loading("Clearing chat history...");
            await api.delete(`/api/chat/workspaces/${currentWorkspace.id}/direct/${activeChat.id}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.dismissAll(); toast.success("Chat history cleared"); setConfirmModal({ isOpen: false, type: "", targetId: "", targetName: "" }); setIsMenuOpen(false); setMessages([]);
        } catch { toast.dismissAll(); toast.error("Failed to clear chat history"); }
    };

    const handleJoinChannelById = async (channelId) => {
        try {
            toast.loading("Joining channel...");
            await api.post(`/api/chat/channels/${channelId}/join`, {}, { headers: { Authorization: `Bearer ${token}` } });
            toast.dismissAll(); toast.success("Joined channel successfully!"); setConfirmModal({ isOpen: false, type: "", targetId: "", targetName: "" });
            channelHook.setIsBrowseChannelsOpen(false); await fetchChannels();
            const targetChan = channels.find(c => c.id === channelId) || { name: "general", isPrivate: false };
            setActiveChat({ type: "channel", id: channelId, name: targetChan.name, isArchived: false, isPrivate: targetChan.isPrivate });
            setIsNotMember(false); fetchMessages();
        } catch (err) { toast.dismissAll(); toast.error(err.response?.data?.message || "Failed to join channel"); }
    };

    const handleJoinChannel = async () => { if (activeChat.type === "channel" && activeChat.id) await handleJoinChannelById(activeChat.id); };
    const handleCopyInviteLink = () => { navigator.clipboard.writeText(`${window.location.origin}/chat?invite=${activeChat.id}`); toast.success("Invite link copied!"); setIsMenuOpen(false); };
    const handleAddTeammate = async (memberId) => {
        try {
            toast.loading("Adding teammate...");
            await api.post(`/api/chat/channels/${activeChat.id}/members`, { memberId }, { headers: { Authorization: `Bearer ${token}` } });
            toast.dismissAll(); toast.success("Teammate added!"); setIsInviteTeammateOpen(false); fetchChannels();
        } catch (err) { toast.dismissAll(); toast.error(err.response?.data?.message || "Failed to add teammate"); }
    };

    useEffect(() => { fetchChannels(); }, [fetchChannels]);
    useEffect(() => { fetchMessages(); setThreadParent(null); setActiveRightPanel(null); }, [fetchMessages, activeChat.id, activeChat.type, setThreadParent]);
    useEffect(() => { fetchReplies(); }, [fetchReplies]);

    const dmMembers = (currentWorkspace?.members || []).filter(m => m.user && m.user.id !== currentUser?.id);
    const activeChannelObj = channels.find(c => c.id === activeChat.id);
    const channelMemberIds = activeChannelObj?.members?.map(m => m.id) || [];
    const joinedChannelMembers = activeChannelObj?.members || [];
    const filteredChannelMembers = joinedChannelMembers.filter(m => m.name.toLowerCase().includes(membersSearchQuery.toLowerCase()));
    const inviteCandidates = (currentWorkspace?.members || []).filter(m => m.user && m.user.id !== currentUser?.id && !channelMemberIds.includes(m.user.id));
    const canEditChannel = activeChat.type === "channel" && (activeChannelObj?.creatorId === currentUser?.id || currentWorkspace?.ownerId === currentUser?.id);
    const filteredPublicChannels = channels.filter(c => !c.isPrivate).filter(c => c.name.toLowerCase().includes(channelHook.browseSearchQuery.toLowerCase()));

    return {
        currentUser, currentWorkspace, isDark, colors, activeChat, setActiveChat, isMenuOpen, setIsMenuOpen, isInviteTeammateOpen, setIsInviteTeammateOpen,
        activeRightPanel, setActiveRightPanel, membersSearchQuery, setMembersSearchQuery, confirmModal, setConfirmModal, dmMembers, activeChannelObj,
        joinedChannelMembers, filteredChannelMembers, inviteCandidates, canEditChannel, filteredPublicChannels, handleEditChannel, handleToggleArchive,
        handleDeleteChannel, handleClearDMs, handleJoinChannel, handleJoinChannelById, handleCopyInviteLink, handleAddTeammate, ...channelHook, ...messageHook
    };
}
