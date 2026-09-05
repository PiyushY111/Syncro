let sanitizeHtml;
try {
  sanitizeHtml = (await import('sanitize-html')).default;
} catch (e) {
  // Dependency fallback if sanitize-html is installing
}

/**
 * Lightweight, high-performance native regex HTML tag stripper fallback.
 */
const nativeSanitizeHtml = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/<[^>]*>/g, (match) => {
      const allowed = ['<b>', '</b>', '<i>', '</i>', '<em>', '</em>', '<strong>', '</strong>', '<p>', '</p>', '<br>', '<br/>'];
      return allowed.includes(match.toLowerCase()) ? match : '';
    })
    .trim();
};

/**
 * Sanitizes string input stripping dangerous XSS script tags and executable attributes.
 *
 * @param {string} input
 * @returns {string} Sanitized string
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  if (sanitizeHtml) {
    try {
      return sanitizeHtml(input, {
        allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'],
        allowedAttributes: { a: ['href', 'target', 'rel'] },
        allowedSchemes: ['http', 'https', 'mailto'],
      }).trim();
    } catch {}
  }
  return nativeSanitizeHtml(input);
};

const deepSanitize = (obj) => {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(deepSanitize);
  }
  if (obj !== null && typeof obj === 'object') {
    const cleaned = {};
    for (const key of Object.keys(obj)) {
      cleaned[key] = deepSanitize(obj[key]);
    }
    return cleaned;
  }
  return obj;
};

export const sanitizeRequestBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = deepSanitize(req.body);
  }
  next();
};

export default {
  sanitizeString,
  sanitizeRequestBody,
};
