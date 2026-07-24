import { useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '@/configs/api';

export function useChatMessages(token, currentWorkspace, activeChat) {
    const [messages, setMessages] = useState([]);
    const [typedMsg, setTypedMsg] = useState("");
    const [isNotMember, setIsNotMember] = useState(false);

    const [threadParent, setThreadParent] = useState(null);
    const [threadReplies, setThreadReplies] = useState([]);
    const [typedReply, setTypedReply] = useState("");

    const chatEndRef = useRef(null);
    const threadEndRef = useRef(null);

    const fetchMessages = useCallback(async () => {
        if (!activeChat?.id || !token) return;
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
        } catch (err) {
            if (err.response?.status === 403 && err.response?.data?.isNotMember) {
                setIsNotMember(true);
                setMessages([]);
            }
        }
    }, [activeChat?.id, activeChat?.type, currentWorkspace?.id, token]);

    const fetchReplies = useCallback(async () => {
        if (!threadParent?.id || !token) return;
        try {
            const { data } = await api.get(`/api/chat/messages/${threadParent.id}/replies`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setThreadReplies(data.replies || []);
        } catch (err) {
            console.error(err);
        }
    }, [threadParent?.id, token]);

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
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to send message");
        }
    };

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
        } catch {
            toast.error("Failed to send reply");
        }
    };

    return {
        messages, setMessages,
        typedMsg, setTypedMsg,
        isNotMember, setIsNotMember,
        threadParent, setThreadParent,
        threadReplies, setThreadReplies,
        typedReply, setTypedReply,
        chatEndRef, threadEndRef,
        fetchMessages, fetchReplies,
        handleSendMessage, handleSendReply
    };
}
