"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = validateRequest;
exports.requireAuth = requireAuth;
exports.rateLimit = rateLimit;
exports.responseHelpers = responseHelpers;
exports.requestLogger = requestLogger;
exports.errorHandler = errorHandler;
const errors_1 = require("./errors");
// Request validation middleware
function validateRequest(schema) {
    return (req, res, next) => {
        try {
            const validation = schema.safeParse({
                body: req.body,
                query: req.query,
                params: req.params,
                headers: req.headers
            });
            if (!validation.success) {
                return res.error('Validation failed', 400, validation.error.issues);
            }
            req.body = validation.data.body || req.body;
            req.query = validation.data.query || req.query;
            req.params = validation.data.params || req.params;
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
// Authentication middleware
function requireAuth() {
    return async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.error('Authentication required', 401);
            }
            const token = authHeader.substring(7);
            // Validate token with Supabase or your auth service
            // This is a placeholder - implement your actual auth logic
            const user = await validateAuthToken(token);
            if (!user) {
                return res.error('Invalid or expired token', 401);
            }
            req.user = user;
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
// Rate limiting middleware
function rateLimit(maxRequests, windowMs) {
    const requests = new Map();
    return (req, res, next) => {
        const clientId = req.ip || req.headers['x-forwarded-for'] || 'unknown';
        const now = Date.now();
        const windowStart = now - windowMs;
        // Clean up old entries
        for (const [key, value] of requests.entries()) {
            if (value.resetTime < windowStart) {
                requests.delete(key);
            }
        }
        const clientRequests = requests.get(clientId) || { count: 0, resetTime: now + windowMs };
        if (clientRequests.count >= maxRequests && clientRequests.resetTime > now) {
            const resetTime = Math.ceil((clientRequests.resetTime - now) / 1000);
            res.set({
                'X-RateLimit-Limit': maxRequests.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': resetTime.toString()
            });
            return res.error('Rate limit exceeded', 429, {
                retryAfter: resetTime
            });
        }
        clientRequests.count++;
        requests.set(clientId, clientRequests);
        req.rateLimitInfo = {
            remaining: Math.max(0, maxRequests - clientRequests.count),
            reset: Math.ceil((clientRequests.resetTime - now) / 1000),
            limit: maxRequests
        };
        res.set({
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': req.rateLimitInfo.remaining.toString(),
            'X-RateLimit-Reset': req.rateLimitInfo.reset.toString()
        });
        next();
    };
}
// Response helpers middleware
function responseHelpers() {
    return (req, res, next) => {
        res.success = function (data, statusCode = 200) {
            return this.status(statusCode).json({
                success: true,
                data,
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'] || generateRequestId()
            });
        };
        res.error = function (message, statusCode = 500, details) {
            return this.status(statusCode).json({
                success: false,
                error: {
                    message,
                    details,
                    code: getErrorCode(statusCode)
                },
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'] || generateRequestId()
            });
        };
        next();
    };
}
// Request logging middleware
function requestLogger() {
    return (req, res, next) => {
        const startTime = Date.now();
        const requestId = req.headers['x-request-id'] || generateRequestId();
        // Add request ID to headers
        req.headers['x-request-id'] = requestId;
        res.set('X-Request-ID', requestId);
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`, {
            requestId,
            userAgent: req.headers['user-agent'],
            ip: req.ip,
            userId: req.user?.id
        });
        // Log response when finished
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode}`, {
                requestId,
                duration: `${duration}ms`,
                statusCode: res.statusCode
            });
        });
        next();
    };
}
// Error handling middleware
function errorHandler() {
    return (error, req, res, next) => {
        console.error('API Error:', {
            message: error.message,
            stack: error.stack,
            url: req.url,
            method: req.method,
            userId: req.user?.id,
            requestId: req.headers['x-request-id']
        });
        if (error instanceof errors_1.ApiException) {
            return res.error(error.message, error.statusCode, error.details);
        }
        if (error.name === 'ValidationError') {
            return res.error('Validation failed', 400, error.message);
        }
        if (error.name === 'UnauthorizedError') {
            return res.error('Unauthorized', 401);
        }
        // Default error response
        return res.error(process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : error.message, 500);
    };
}
// Utility functions
async function validateAuthToken(token) {
    // Implement your token validation logic here
    // This could be JWT validation, Supabase auth, etc.
    return null;
}
function generateRequestId() {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
}
function getErrorCode(statusCode) {
    const codes = {
        400: 'BAD_REQUEST',
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        409: 'CONFLICT',
        422: 'UNPROCESSABLE_ENTITY',
        429: 'RATE_LIMIT_EXCEEDED',
        500: 'INTERNAL_SERVER_ERROR',
        502: 'BAD_GATEWAY',
        503: 'SERVICE_UNAVAILABLE'
    };
    return codes[statusCode] || 'UNKNOWN_ERROR';
}
//# sourceMappingURL=request-handler.js.map