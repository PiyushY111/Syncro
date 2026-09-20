import jwt from "jsonwebtoken";
import { parseCookie as parseCookies } from "cookie";
import { prisma } from "../config/prisma.js";

const extractTokenFromCookieHeader = (cookieHeader) => {
    if (!cookieHeader) return null;
    try {
        const parsed = parseCookies(cookieHeader);
        return parsed.syncro_access_token || null;
    } catch {
        return null;
    }
};

export const socketAuthMiddleware = async (socket, next) => {
    try {
        // Cookie is the primary transport now that the client no longer holds the JWT
        // itself — fall back to the legacy auth/header/query token forms for any
        // non-browser client that authenticates with a Bearer token directly.
        let token = extractTokenFromCookieHeader(socket.handshake.headers?.cookie) ||
                    socket.handshake.auth?.token ||
                    socket.handshake.headers?.authorization?.replace("Bearer ", "") ||
                    socket.handshake.query?.token;

        if (!token) {
            return next(new Error("Authentication error: No token provided"));
        }

        if (!process.env.JWT_SECRET) {
            return next(new Error("Authentication error: Server misconfigured"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

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
