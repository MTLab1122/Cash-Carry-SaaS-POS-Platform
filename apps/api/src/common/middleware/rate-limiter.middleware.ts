import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitBucket {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  // In-memory sliding window store (can be connected to Redis in distributed deployment)
  private static globalBuckets = new Map<string, RateLimitBucket>();
  private static authBuckets = new Map<string, RateLimitBucket>();

  use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const path = req.path;

    // 1. Auth Endpoint Limiter: Max 5 requests per 900s (15 min)
    const isAuthEndpoint =
      path.includes('/auth/login') ||
      path.includes('/auth/register') ||
      path.includes('/auth/forgot-password') ||
      path.includes('/auth/reset-password');

    if (isAuthEndpoint && req.method === 'POST') {
      const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : '';
      const authKey = `auth:${ip}:${email}`;
      const windowMs = 15 * 60 * 1000; // 900 seconds
      const maxAuthRequests = 5;

      let bucket = RateLimiterMiddleware.authBuckets.get(authKey);
      if (!bucket || now > bucket.resetTime) {
        bucket = { count: 1, resetTime: now + windowMs };
        RateLimiterMiddleware.authBuckets.set(authKey, bucket);
      } else {
        bucket.count++;
      }

      if (bucket.count > maxAuthRequests) {
        const retryAfterSeconds = Math.ceil((bucket.resetTime - now) / 1000);
        res.setHeader('Retry-After', retryAfterSeconds.toString());
        res.setHeader('Content-Type', 'application/problem+json');
        res.status(HttpStatus.TOO_MANY_REQUESTS).json({
          type: 'https://tools.ietf.org/html/rfc6585#section-4',
          title: 'Too Many Requests',
          status: 429,
          detail: `Authentication rate limit exceeded. Try again in ${retryAfterSeconds} seconds.`,
          instance: req.url,
          retryAfter: retryAfterSeconds,
        });
        return;
      }
    }

    // 2. Global API Limiter: Max 100 requests per 60s per IP
    const globalKey = `global:${ip}`;
    const globalWindowMs = 60 * 1000; // 60 seconds
    const maxGlobalRequests = 100;

    let globalBucket = RateLimiterMiddleware.globalBuckets.get(globalKey);
    if (!globalBucket || now > globalBucket.resetTime) {
      globalBucket = { count: 1, resetTime: now + globalWindowMs };
      RateLimiterMiddleware.globalBuckets.set(globalKey, globalBucket);
    } else {
      globalBucket.count++;
    }

    if (globalBucket.count > maxGlobalRequests) {
      const retryAfterSeconds = Math.ceil((globalBucket.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds.toString());
      res.setHeader('Content-Type', 'application/problem+json');
      res.status(HttpStatus.TOO_MANY_REQUESTS).json({
        type: 'https://tools.ietf.org/html/rfc6585#section-4',
        title: 'Too Many Requests',
        status: 429,
        detail: `Global API rate limit exceeded. Max 100 requests per minute allowed.`,
        instance: req.url,
        retryAfter: retryAfterSeconds,
      });
      return;
    }

    // Add standard rate limit headers
    res.setHeader('X-RateLimit-Limit', '100');
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxGlobalRequests - globalBucket.count).toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(globalBucket.resetTime / 1000).toString());

    next();
  }
}

