import { NextFunction, Request, Response } from 'express';
import AppError from '../utils/AppError';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Lightweight in-memory IP rate limiter.
 */
export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, max, message = 'Too many requests, please try again later.' } = options;
  const buckets = new Map<string, Bucket>();

  return (req: Request, _res: Response, next: NextFunction) => {
    const now = Date.now();
    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]?.trim()) ||
      req.ip ||
      'unknown';

    const existing = buckets.get(ip);
    if (!existing || existing.resetAt <= now) {
      buckets.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    existing.count += 1;
    if (existing.count > max) {
      return next(new AppError(message, 429));
    }

    // Periodic cleanup of expired buckets
    if (buckets.size > 2000) {
      for (const [key, val] of buckets.entries()) {
        if (val.resetAt <= now) buckets.delete(key);
      }
    }

    next();
  };
}
