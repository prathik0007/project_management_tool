// Small dependency-free protections appropriate for this cookie-based API.
export const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Powered-By', '');
  next();
};

const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 20;

export const authRateLimit = (req, res, next) => {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const attempt = attempts.get(key);
  const entry = !attempt || now - attempt.startedAt > WINDOW_MS
    ? { startedAt: now, count: 1 }
    : { ...attempt, count: attempt.count + 1 };

  attempts.set(key, entry);
  if (entry.count > MAX_ATTEMPTS) {
    return res.status(429).json({ success: false, message: 'Too many authentication attempts. Please try again later.' });
  }
  next();
};
