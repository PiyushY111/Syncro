/**
 * Shared CORS origin allowlist — used by both the Express HTTP layer (app.js)
 * and the Socket.IO server (socketInit.js) so the two never drift out of sync.
 */

export const allowedOrigins = [
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(url => url.trim().replace(/\/$/, '')) : []),
  'https://syncro.piyushydv.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

export const allowedOriginSuffixes = (process.env.ALLOWED_ORIGIN_SUFFIXES || '.piyushydv.com,piyushydv.com')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

export const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const normalizedOrigin = origin.replace(/\/$/, '').toLowerCase();
  return (
    allowedOrigins.includes(normalizedOrigin) ||
    allowedOriginSuffixes.some(suffix => normalizedOrigin.endsWith(suffix))
  );
};

export default { allowedOrigins, allowedOriginSuffixes, isOriginAllowed };
