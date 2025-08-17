"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestTimeout = exports.requestSizeLimit = exports.sanitizeInput = exports.jwtAuth = exports.apiKeyAuth = exports.advancedRateLimit = exports.securityHeaders = void 0;
const helmet_1 = __importDefault(require("helmet"));
const redis_1 = require("redis");
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const production_1 = require("../config/production");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const supabase_server_1 = require("../lib/supabase-server");
// Redis client for rate limiting
const redisClient = (0, redis_1.createClient)({
    url: production_1.productionConfig.redis.url,
    password: production_1.productionConfig.redis.password,
});
redisClient.connect().catch(console.error);
// Advanced rate limiter with Redis
const rateLimiter = new rate_limiter_flexible_1.RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: production_1.productionConfig.rateLimit.redisPrefix,
    points: production_1.productionConfig.rateLimit.maxRequests,
    duration: Math.floor(production_1.productionConfig.rateLimit.windowMs / 1000),
    blockDuration: 60, // Block for 1 minute if limit exceeded
});
// Security headers middleware
exports.securityHeaders = (0, helmet_1.default)({
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
const advancedRateLimit = async (req, res, next) => {
    try {
        const key = req.ip || req.connection.remoteAddress || 'unknown';
        await rateLimiter.consume(key);
        next();
    }
    catch (rejRes) {
        const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
        res.set('Retry-After', String(secs));
        res.status(429).json({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded',
            retryAfter: secs,
        });
    }
};
exports.advancedRateLimit = advancedRateLimit;
// API key authentication middleware
const apiKeyAuth = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
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
exports.apiKeyAuth = apiKeyAuth;
// JWT authentication middleware
const jwtAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Bearer token required',
            });
        }
        const token = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(token, production_1.productionConfig.security.jwtSecret);
        // Verify user exists in database
        const supabase = (0, supabase_server_1.createServerClient)();
        const { data: user, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid or expired token',
            });
        }
        req.user = user;
        next();
    }
    catch (error) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid token',
        });
    }
};
exports.jwtAuth = jwtAuth;
// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
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
exports.sanitizeInput = sanitizeInput;
// Request size limiting
const requestSizeLimit = (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const maxSize = parseInt(production_1.productionConfig.server.maxRequestSize.replace('mb', '')) * 1024 * 1024;
    if (contentLength > maxSize) {
        return res.status(413).json({
            error: 'Payload Too Large',
            message: `Request size exceeds ${production_1.productionConfig.server.maxRequestSize}`,
        });
    }
    next();
};
exports.requestSizeLimit = requestSizeLimit;
// Request timeout middleware
const requestTimeout = (req, res, next) => {
    const timeout = setTimeout(() => {
        if (!res.headersSent) {
            res.status(408).json({
                error: 'Request Timeout',
                message: 'Request took too long to process',
            });
        }
    }, production_1.productionConfig.server.requestTimeout);
    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));
    next();
};
exports.requestTimeout = requestTimeout;
// Helper functions
function isValidApiKey(apiKey) {
    // Implement your API key validation logic
    // This could check against a database, cache, or predefined list
    return apiKey.length >= 32 && apiKey.startsWith('ak_');
}
function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    const sanitized = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            if (typeof value === 'string') {
                // Remove potentially dangerous characters
                sanitized[key] = value
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+\s*=/gi, '');
            }
            else if (typeof value === 'object') {
                sanitized[key] = sanitizeObject(value);
            }
            else {
                sanitized[key] = value;
            }
        }
    }
    return sanitized;
}
//# sourceMappingURL=security.js.map