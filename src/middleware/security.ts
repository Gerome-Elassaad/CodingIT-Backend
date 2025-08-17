import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { createClient } from 'redis';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { productionConfig } from '../config/production';
import jwt from 'jsonwebtoken';
import { createServerClient } from '../lib/supabase-server';

// Redis client for rate limiting
const redisClient = createClient({
  url: productionConfig.redis.url,
  password: productionConfig.redis.password,
});

redisClient.connect().catch(console.error);

// Advanced rate limiter with Redis
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: productionConfig.rateLimit.redisPrefix,
  points: productionConfig.rateLimit.maxRequests,
  duration: Math.floor(productionConfig.rateLimit.windowMs / 1000),
  blockDuration: 60, // Block for 1 minute if limit exceeded
});

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// Advanced rate limiting middleware
export const advancedRateLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    await rateLimiter.consume(key);
    next();
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded',
      retryAfter: secs,
    });
  }
};

// API key authentication middleware
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key required',
    });
  }

  // Validate API key (implement your own logic)
  if (!isValidApiKey(apiKey)) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key',
    });
  }

  next();
};

// JWT authentication middleware
export const jwtAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Bearer token required',
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, productionConfig.security.jwtSecret) as any;
    
    // Verify user exists in database
    const supabase = createServerClient();
    const { data: user, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }

    (req as any).user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token',
    });
  }
};

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  next();
};

// Request size limiting
export const requestSizeLimit = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = parseInt(req.headers['content-length'] || '0');
  const maxSize = parseInt(productionConfig.server.maxRequestSize.replace('mb', '')) * 1024 * 1024;

  if (contentLength > maxSize) {
    return res.status(413).json({
      error: 'Payload Too Large',
      message: `Request size exceeds ${productionConfig.server.maxRequestSize}`,
    });
  }

  next();
};

// Request timeout middleware
export const requestTimeout = (req: Request, res: Response, next: NextFunction) => {
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({
        error: 'Request Timeout',
        message: 'Request took too long to process',
      });
    }
  }, productionConfig.server.requestTimeout);

  res.on('finish', () => clearTimeout(timeout));
  res.on('close', () => clearTimeout(timeout));

  next();
};

// Helper functions
function isValidApiKey(apiKey: string): boolean {
  // Implement your API key validation logic
  // This could check against a database, cache, or predefined list
  return apiKey.length >= 32 && apiKey.startsWith('ak_');
}

function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sanitized: any = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        // Remove potentially dangerous characters
        sanitized[key] = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}