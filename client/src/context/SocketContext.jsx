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
