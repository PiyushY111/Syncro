import dns from 'dns'
dns.setDefaultResultOrder('ipv4first')

import dotenv from 'dotenv'
dotenv.config({ quiet: true })

import http from 'http'
import logger from './src/utils/logger/logger.js'
import { app } from './src/app.js'
import { initSocketIO } from './src/socket/socketInit.js'
import { basePrisma } from './src/config/prisma.js'

if (!process.env.JWT_SECRET) {
    logger.error("FATAL ERROR: JWT_SECRET environment variable is missing!");
    process.exit(1);
}

process.on('uncaughtException', (err) => {
    logger.error('[UNCAUGHT EXCEPTION]', { error: err.message, stack: err.stack });
});

process.on('unhandledRejection', (reason) => {
    logger.error('[UNHANDLED REJECTION]', { reason: String(reason) });
});

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);
initSocketIO(httpServer);

httpServer.listen(PORT, () => {
    logger.info(`Server and Socket.IO engine running on http://localhost:${PORT}`, { port: PORT });
    
    // Render & Cloud Free Tier Keep-Alive Self-Ping Service
    const keepAliveUrl = process.env.RENDER_EXTERNAL_URL || process.env.SERVER_URL || process.env.BACKEND_URL;
    if (keepAliveUrl) {
        const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes
        setInterval(async () => {
            try {
                const endpoint = `${keepAliveUrl.replace(/\/$/, '')}/health`;
                await fetch(endpoint);
                logger.info(`[Keep-Alive Ping] Pinged ${endpoint}`, { endpoint });
            } catch (err) {
                logger.error(`[Keep-Alive Ping Error]`, { error: err.message });
            }
        }, PING_INTERVAL);
        logger.info(`[Keep-Alive Service] Active. Self-pinging ${keepAliveUrl}/health every 10 minutes.`, { keepAliveUrl });
    }
});

// Graceful Shutdown Handler for Zero-Downtime Connection Cleanup
const gracefulShutdown = async (signal) => {
    logger.info(`[SERVER SHUTDOWN] Received ${signal}. Draining in-flight HTTP requests & database connections cleanly...`, { signal });
    httpServer.close(async () => {
        logger.info('[SERVER SHUTDOWN] HTTP server stopped accepting new connections.');
        try {
            await basePrisma.$disconnect();
            logger.info('[SERVER SHUTDOWN] Database connections closed successfully.');
        } catch (err) {
            logger.error('[SERVER SHUTDOWN ERROR]', { error: err.message });
        }
        process.exit(0);
    });

    // Forceful exit fallback after 10 seconds timeout
    setTimeout(() => {
        logger.error('[SERVER SHUTDOWN TIMEOUT] Forcefully terminating process after 10s.');
        process.exit(1);
    }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export { httpServer, app };
