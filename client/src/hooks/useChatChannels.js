import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '@/configs/api';

export function useChatChannels(token, currentWorkspace, activeChat, setActiveChat) {
    const [channels, setChannels] = useState([]);
    const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
    const [newChannelName, setNewChannelName] = useState("");
    const [newChannelDesc, setNewChannelDesc] = useState("");
    const [newChannelIsPrivate, setNewChannelIsPrivate] = useState(false);

    const [isBrowseChannelsOpen, setIsBrowseChannelsOpen] = useState(false);
    const [browseSearchQuery, setBrowseSearchQuery] = useState("");

    const [isEditChannelOpen, setIsEditChannelOpen] = useState(false);
    const [editChannelName, setEditChannelName] = useState("");
    const [editChannelDesc, setEditChannelDesc] = useState("");

    const fetchChannels = useCallback(async () => {
        if (!currentWorkspace?.id || !token) return;
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
    }, [currentWorkspace?.id, token, activeChat.id, activeChat.type, setActiveChat]);

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
        } catch (err) {
            toast.dismissAll();
            toast.error(err.response?.data?.message || "Failed to create channel");
        }
    };

    return {
        channels, setChannels,
        fetchChannels,
        isCreateChannelOpen, setIsCreateChannelOpen,
        newChannelName, setNewChannelName,
        newChannelDesc, setNewChannelDesc,
        newChannelIsPrivate, setNewChannelIsPrivate,
        isBrowseChannelsOpen, setIsBrowseChannelsOpen,
        browseSearchQuery, setBrowseSearchQuery,
        isEditChannelOpen, setIsEditChannelOpen,
        editChannelName, setEditChannelName,
        editChannelDesc, setEditChannelDesc,
        handleCreateChannel
    };
}
