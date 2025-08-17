"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = exports.getCacheStats = exports.warmCache = exports.cacheConfigs = exports.invalidateCache = exports.cache = void 0;
const redis_1 = require("redis");
const production_1 = require("../config/production");
const monitoring_1 = require("./monitoring");
// Redis client for caching
const redisClient = (0, redis_1.createClient)({
    url: production_1.productionConfig.redis.url,
    password: production_1.productionConfig.redis.password,
});
exports.redisClient = redisClient;
redisClient.connect().catch(console.error);
redisClient.on('error', (err) => {
    monitoring_1.logger.error('Redis client error', { error: err.message });
});
redisClient.on('connect', () => {
    monitoring_1.logger.info('Redis client connected');
});
// Default cache middleware
const cache = (options = {}) => {
    const { ttl = 300, // 5 minutes default
    keyPrefix = 'cache:', skipCache = () => false, generateKey = (req) => `${req.method}:${req.originalUrl}`, } = options;
    return async (req, res, next) => {
        // Skip caching for non-GET requests or when skipCache returns true
        if (req.method !== 'GET' || skipCache(req)) {
            return next();
        }
        const cacheKey = `${keyPrefix}${generateKey(req)}`;
        const requestId = req.requestId;
        try {
            // Try to get cached response
            const cachedResponse = await redisClient.get(cacheKey);
            if (cachedResponse) {
                monitoring_1.logger.info('Cache hit', { requestId, cacheKey });
                const parsed = JSON.parse(cachedResponse);
                res.set(parsed.headers);
                res.set('X-Cache', 'HIT');
                return res.status(parsed.statusCode).json(parsed.body);
            }
            monitoring_1.logger.info('Cache miss', { requestId, cacheKey });
            // Store original res.json method
            const originalJson = res.json.bind(res);
            // Override res.json to cache the response
            res.json = function (body) {
                // Cache the response
                const responseToCache = {
                    statusCode: res.statusCode,
                    headers: res.getHeaders(),
                    body,
                };
                redisClient.setex(cacheKey, ttl, JSON.stringify(responseToCache))
                    .catch(err => monitoring_1.logger.error('Cache set error', { error: err.message, cacheKey }));
                res.set('X-Cache', 'MISS');
                return originalJson(body);
            };
            next();
        }
        catch (error) {
            monitoring_1.logger.error('Cache middleware error', {
                error: error.message,
                requestId,
                cacheKey
            });
            next(); // Continue without caching on error
        }
    };
};
exports.cache = cache;
// Cache invalidation middleware
const invalidateCache = (patterns) => {
    return async (req, res, next) => {
        const requestId = req.requestId;
        try {
            for (const pattern of patterns) {
                const keys = await redisClient.keys(pattern);
                if (keys.length > 0) {
                    await redisClient.del(keys);
                    monitoring_1.logger.info('Cache invalidated', { requestId, pattern, keysCount: keys.length });
                }
            }
        }
        catch (error) {
            monitoring_1.logger.error('Cache invalidation error', {
                error: error.message,
                requestId,
                patterns
            });
        }
        next();
    };
};
exports.invalidateCache = invalidateCache;
// Specific cache configurations for different endpoints
exports.cacheConfigs = {
    // Cache user data for 5 minutes
    userData: (0, exports.cache)({
        ttl: 300,
        keyPrefix: 'user:',
        generateKey: (req) => `${req.params.userId || req.user?.id}`,
        skipCache: (req) => !req.params.userId && !req.user?.id,
    }),
    // Cache API responses for 1 hour
    apiResponse: (0, exports.cache)({
        ttl: 3600,
        keyPrefix: 'api:',
        skipCache: (req) => req.headers.authorization !== undefined,
    }),
    // Cache static data for 24 hours
    staticData: (0, exports.cache)({
        ttl: 86400,
        keyPrefix: 'static:',
    }),
    // Cache search results for 15 minutes
    searchResults: (0, exports.cache)({
        ttl: 900,
        keyPrefix: 'search:',
        generateKey: (req) => `${req.query.q}:${req.query.page || 1}`,
        skipCache: (req) => !req.query.q,
    }),
};
// Cache warming functions
exports.warmCache = {
    // Warm frequently accessed data
    async warmFrequentData() {
        try {
            monitoring_1.logger.info('Starting cache warming for frequent data');
            // Add your cache warming logic here
            // Example: Pre-load popular user data, templates, etc.
            monitoring_1.logger.info('Cache warming completed');
        }
        catch (error) {
            monitoring_1.logger.error('Cache warming failed', { error: error.message });
        }
    },
    // Warm cache on application startup
    async onStartup() {
        await this.warmFrequentData();
    },
};
// Cache statistics
const getCacheStats = async () => {
    try {
        const info = await redisClient.info('memory');
        const keyspace = await redisClient.info('keyspace');
        return {
            memory: info,
            keyspace: keyspace,
            connected: redisClient.isReady,
        };
    }
    catch (error) {
        monitoring_1.logger.error('Failed to get cache stats', { error: error.message });
        return { error: error.message };
    }
};
exports.getCacheStats = getCacheStats;
//# sourceMappingURL=caching.js.map