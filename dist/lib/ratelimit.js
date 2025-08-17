"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ratelimit;
const rateLimitStore = new Map();
async function ratelimit(identifier, maxRequests, windowMs) {
    if (!identifier) {
        return false;
    }
    const now = Date.now();
    const key = `ratelimit:${identifier}`;
    // Clean up expired entries
    for (const [k, v] of rateLimitStore.entries()) {
        if (v.resetTime < now) {
            rateLimitStore.delete(k);
        }
    }
    const current = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };
    if (current.count >= maxRequests && current.resetTime > now) {
        return {
            success: false,
            limit: maxRequests,
            remaining: 0,
            reset: Math.ceil((current.resetTime - now) / 1000),
            amount: maxRequests
        };
    }
    current.count++;
    rateLimitStore.set(key, current);
    return {
        success: true,
        limit: maxRequests,
        remaining: Math.max(0, maxRequests - current.count),
        reset: Math.ceil((current.resetTime - now) / 1000),
        amount: maxRequests
    };
}
//# sourceMappingURL=ratelimit.js.map