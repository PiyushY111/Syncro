import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const { token: authTok, user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const token = authTok || localStorage.getItem('pm-auth-token');

        if (!token || !user) {
            if (socket) socket.disconnect();
            setSocket(null);
            setIsConnected(false);
            return;
        }

        const socketUrl = import.meta.env.VITE_SERVER_URL || import.meta.env.VITE_BASE_URL || "http://localhost:5001";
        const socketInstance = io(socketUrl, {
            auth: { token },
            extraHeaders: { Authorization: `Bearer ${token}` },
            transports: ["websocket", "polling"],
            reconnectionAttempts: 10,
            reconnectionDelay: 500
        });

        socketInstance.on("connect", () => {
            console.log("[SOCKET CONNECTED] Ultra-low latency active");
            setIsConnected(true);
        });

        socketInstance.on("disconnect", () => {
            setIsConnected(false);
        });

        socketInstance.on("presence:update", ({ onlineUsers: usersList }) => {
            setOnlineUsers(usersList || []);
        });

        socketInstance.on("message:received", (msg) => {
            console.log("[DEBUG SOCKET PROVIDER] Message received:", msg);
            const activeChatId = localStorage.getItem('active_chat_id');
            const targetId = msg.channelId || msg.userId || msg.senderId;
            console.log("[DEBUG SOCKET PROVIDER] targetId:", targetId, "activeChatId:", activeChatId, "senderId:", msg.userId, "currentUserId:", user?.id);
            if (targetId && targetId !== activeChatId && msg.userId !== user?.id) {
                // Add to standard unread chats
                const key = 'unread_chats';
                let unread = [];
                try { unread = JSON.parse(localStorage.getItem(key) || "[]"); } catch {}
                if (!unread.includes(targetId)) {
                    unread.push(targetId);
                    localStorage.setItem(key, JSON.stringify(unread));
                    console.log("[DEBUG SOCKET PROVIDER] Unread list updated & event dispatched:", unread);
                }

                // Check for @mention (case-insensitive, matches first name / first word followed by word boundary)
                const firstName = user?.name ? user.name.trim().toLowerCase().split(/\s+/)[0] : '';
                const isMention = msg.content && firstName && new RegExp(`@${firstName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(msg.content);
                if (isMention) {
                    const mentionKey = 'unread_mentions';
                    let mentions = [];
                    try { mentions = JSON.parse(localStorage.getItem(mentionKey) || "[]"); } catch {}
                    if (!mentions.includes(targetId)) {
                        mentions.push(targetId);
                        localStorage.setItem(mentionKey, JSON.stringify(mentions));
                        console.log("[DEBUG SOCKET PROVIDER] Mention list updated:", mentions);
                    }
                }

                window.dispatchEvent(new CustomEvent('chat:unread_change'));
            }
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [authTok, user?.id]);

    return (
        <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error("useSocket must be used within a SocketProvider");
    }
    return context;
};
