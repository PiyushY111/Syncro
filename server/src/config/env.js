/**
 * Loads .env into process.env.
 *
 * Must be the FIRST import in server.js: ES module imports are evaluated before the
 * importing file's body runs, so calling dotenv.config() inline in server.js happens
 * after every other module has already read process.env. In production the host injects
 * env vars before Node starts, which is why that ordering bug only showed up locally.
 */
import dotenv from 'dotenv';

dotenv.config({ quiet: true });
