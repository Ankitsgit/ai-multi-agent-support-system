// ==============================================
// RATE LIMIT MIDDLEWARE
// Prevents abuse and controls AI API costs
// ==============================================

import type { MiddlewareHandler } from 'hono';

// Simple in-memory rate limiter (use Redis in production)
const requestCounts = new Map<string, { count: number; resetAt: number }>();

interface RateLimitOptions {
  windowMs: number; // Time window in ms
  max: number;      // Max requests per window
  message?: string;
}

export function rateLimit(options: RateLimitOptions): MiddlewareHandler {
  const { windowMs, max, message = 'Too many requests, please try again later.' } = options;

  return async (c, next) => {
    const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
    const key = `${ip}:${c.req.path}`;
    const now = Date.now();

    const record = requestCounts.get(key);

    if (!record || now > record.resetAt) {
      // New window
      requestCounts.set(key, { count: 1, resetAt: now + windowMs });
      c.header('X-RateLimit-Limit', String(max));
      c.header('X-RateLimit-Remaining', String(max - 1));
      c.header('X-RateLimit-Reset', String(Math.ceil((now + windowMs) / 1000)));
      return next();
    }

    if (record.count >= max) {
      c.header('X-RateLimit-Limit', String(max));
      c.header('X-RateLimit-Remaining', '0');
      c.header('Retry-After', String(Math.ceil((record.resetAt - now) / 1000)));
      return c.json({ success: false, error: message, code: 'RATE_LIMIT_EXCEEDED' }, 429);
    }

    record.count++;
    requestCounts.set(key, record);
    c.header('X-RateLimit-Limit', String(max));
    c.header('X-RateLimit-Remaining', String(max - record.count));
    return next();
  };
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetAt) {
      requestCounts.delete(key);
    }
  }
}, 5 * 60 * 1000);
