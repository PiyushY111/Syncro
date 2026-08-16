import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";

export const socketAuthMiddleware = async (socket, next) => {
    try {
        let token = socket.handshake.auth?.token ||
                    socket.handshake.headers?.authorization?.replace("Bearer ", "") ||
                    socket.handshake.query?.token;

        if (!token) {
            return next(new Error("Authentication error: No token provided"));
        }

        const secret = process.env.JWT_SECRET || "change_this_to_a_long_random_secret";
        const decoded = jwt.verify(token, secret);

        if (decoded.jti) {
            const { redisCache } = await import("../config/redis.js");
            const isRevoked = await redisCache.get(`revoked:${decoded.jti}`);
            if (isRevoked) {
                return next(new Error("Authentication error: Token has been revoked"));
            }
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId || decoded.id },
            select: { id: true, name: true, email: true, image: true }
        });

        if (!user) {
            return next(new Error("Authentication error: User not found"));
        }

        socket.user = user;
        next();
    } catch (err) {
        console.error("[SOCKET AUTH ERROR]", err.message);
        next(new Error("Authentication error: Invalid or expired token"));
    }
};
