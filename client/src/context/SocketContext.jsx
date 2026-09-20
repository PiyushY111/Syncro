import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!user) {
            if (socket) socket.disconnect();
            setSocket(null);
            setIsConnected(false);
            return;
        }

        const socketUrl = import.meta.env.VITE_SERVER_URL || import.meta.env.VITE_BASE_URL || "http://localhost:5001";
        // Auth is carried by the httpOnly session cookie (sent automatically via withCredentials) —
        // the server's socket auth middleware reads it straight off the handshake headers.
        const socketInstance = io(socketUrl, {
            withCredentials: true,
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
            const activeChatId = localStorage.getItem('active_chat_id');
            const targetId = msg.channelId || msg.userId || msg.senderId;
            if (targetId && targetId !== activeChatId && msg.userId !== user?.id) {
                // Add to standard unread chats
                const key = 'unread_chats';
                let unread = [];
                try { unread = JSON.parse(localStorage.getItem(key) || "[]"); } catch { /* corrupt cache entry, ignore */ }
                if (!unread.includes(targetId)) {
                    unread.push(targetId);
                    localStorage.setItem(key, JSON.stringify(unread));
                }

                // Check for @mention (case-insensitive, matches first name / first word followed by word boundary)
                const firstName = user?.name ? user.name.trim().toLowerCase().split(/\s+/)[0] : '';
                const isMention = msg.content && firstName && new RegExp(`@${firstName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(msg.content);
                if (isMention) {
                    const mentionKey = 'unread_mentions';
                    let mentions = [];
                    try { mentions = JSON.parse(localStorage.getItem(mentionKey) || "[]"); } catch { /* corrupt cache entry, ignore */ }
                    if (!mentions.includes(targetId)) {
                        mentions.push(targetId);
                        localStorage.setItem(mentionKey, JSON.stringify(mentions));
                    }
                }

                window.dispatchEvent(new CustomEvent('chat:unread_change'));
            }
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [user?.id]);

    return (
        <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error("useSocket must be used within a SocketProvider");
    }
    return context;
};
