let helmet;
try {
  helmet = (await import('helmet')).default;
} catch (e) {
  // Dependency fallback if helmet is installing
}

export const configureSecurityHeaders = () => {
  if (helmet) {
    try {
      return helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            // No inline <script> tags anywhere in the client bundle (Vite emits external files only) —
            // 'unsafe-inline' would silently defeat CSP's main XSS defense, so it's intentionally omitted here.
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
            connectSrc: ["'self'", 'wss:', 'https:'],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameAncestors: ["'none'"],
          },
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        frameguard: { action: 'deny' },
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
        noSniff: true,
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        xssFilter: true,
      });
    } catch {}
  }

  // Native HTTP Security Headers Fallback
  return (req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none';");
    next();
  };
};

export default configureSecurityHeaders;
