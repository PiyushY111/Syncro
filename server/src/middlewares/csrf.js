import crypto from 'crypto';
import { timingSafeCompare } from '../utils/crypto.js';
import { ForbiddenError } from '../utils/errors/appError.js';

export const CSRF_COOKIE_NAME = 'syncro_csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Cookie options for the CSRF anchor cookie. This is httpOnly — the client never
 * reads it via `document.cookie`. That matters because the API and the web app are
 * deployed on different subdomains (api.syncro.piyushydv.com vs syncro.piyushydv.com):
 * a host-only cookie set by the API is invisible to JS running on the app's page,
 * even though the browser still attaches it automatically on requests back to the API.
 * So instead of the classic "client reads the cookie" double-submit pattern, the
 * server hands the token to the client once, in the authenticated JSON response body
 * (see issueCsrfCookie's return value), and the client echoes it back in a header.
 * The httpOnly cookie is the thing verifyCsrfToken compares that header against.
 */
export const csrfCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge,
});

/**
 * Issues a fresh random CSRF token, sets it as the httpOnly anchor cookie, and
 * returns the raw value so the caller can include it in the JSON response body.
 * Call this alongside session cookie issuance (login verify, refresh, /me) and
 * clear the cookie on logout.
 */
export const issueCsrfCookie = (res, maxAge) => {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie(CSRF_COOKIE_NAME, token, csrfCookieOptions(maxAge));
  return token;
};

/**
 * Verifies the double-submit CSRF token for cookie-authenticated, state-changing
 * requests. Deliberately a no-op for GET/HEAD/OPTIONS — CSRF defends against a
 * browser being tricked into *causing an effect*, not against reading data via a
 * safe/idempotent method, and the client never attaches the header on those anyway.
 * Also a no-op when the request used a Bearer token — a cross-site request forged
 * against a victim's browser cannot attach an Authorization header on the victim's
 * behalf, so Bearer-authenticated callers aren't a CSRF target to begin with.
 * Mounted at the router level (covering every method on that router) rather than
 * per-route, so this method check is what keeps GETs working.
 */
export const verifyCsrfToken = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const authHeader = req.headers.authorization || '';
  const usedBearerToken = authHeader.startsWith('Bearer ');

  if (usedBearerToken) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME];

  if (!cookieToken || !headerToken || !timingSafeCompare(String(cookieToken), String(headerToken))) {
    return next(new ForbiddenError('Missing or invalid CSRF token'));
  }

  next();
};

export default { CSRF_COOKIE_NAME, issueCsrfCookie, verifyCsrfToken, csrfCookieOptions };
