import { Request, Response, NextFunction } from 'express';
import { createClient } from 'redis';
import { productionConfig } from '../config/production';
import { logger } from './monitoring';

// Redis client for caching
const redisClient = createClient({
  url: productionConfig.redis.url,
  password: productionConfig.redis.password,
});

redisClient.connect().catch(console.error);

redisClient.on('error', (err) => {
  logger.error('Redis client error', { error: err.message });
});

redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

// Cache configuration
interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string;
  skipCache?: (req: Request) => boolean;
  generateKey?: (req: Request) => string;
}

// Default cache middleware
export const cache = (options: CacheOptions = {}) => {
  const {
    ttl = 300, // 5 minutes default
    keyPrefix = 'cache:',
    skipCache = () => false,
    generateKey = (req) => `${req.method}:${req.originalUrl}`,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests or when skipCache returns true
    if (req.method !== 'GET' || skipCache(req)) {
      return next();
    }

    const cacheKey = `${keyPrefix}${generateKey(req)}`;
    const requestId = (req as any).requestId;

    try {
      // Try to get cached response
      const cachedResponse = await redisClient.get(cacheKey);
      
      if (cachedResponse) {
        logger.info('Cache hit', { requestId, cacheKey });
        
        const parsed = JSON.parse(cachedResponse);
        res.set(parsed.headers);
        res.set('X-Cache', 'HIT');
        return res.status(parsed.statusCode).json(parsed.body);
      }

      logger.info('Cache miss', { requestId, cacheKey });

      // Store original res.json method
      const originalJson = res.json.bind(res);
      
      // Override res.json to cache the response
      res.json = function(body: any) {
        // Cache the response
        const responseToCache = {
          statusCode: res.statusCode,
          headers: res.getHeaders(),
          body,
        };

        redisClient.setex(cacheKey, ttl, JSON.stringify(responseToCache))
          .catch((err: any) => logger.error('Cache set error', { error: err.message, cacheKey }));

        res.set('X-Cache', 'MISS');
        return originalJson(body);
      };

      next();
    } catch (error: any) {
      logger.error('Cache middleware error', { 
        error: error.message, 
        requestId, 
        cacheKey 
      });
      next(); // Continue without caching on error
    }
  };
};

// Cache invalidation middleware
export const invalidateCache = (patterns: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const requestId = (req as any).requestId;

    try {
      for (const pattern of patterns) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(keys);
          logger.info('Cache invalidated', { requestId, pattern, keysCount: keys.length });
        }
      }
    } catch (error: any) {
      logger.error('Cache invalidation error', { 
        error: error.message, 
        requestId, 
        patterns 
      });
    }

    next();
  };
};

// Specific cache configurations for different endpoints
export const cacheConfigs = {
  // Cache user data for 5 minutes
  userData: cache({
    ttl: 300,
    keyPrefix: 'user:',
    generateKey: (req) => `${req.params.userId || (req as any).user?.id}`,
    skipCache: (req) => !req.params.userId && !(req as any).user?.id,
  }),

  // Cache API responses for 1 hour
  apiResponse: cache({
    ttl: 3600,
    keyPrefix: 'api:',
    skipCache: (req) => req.headers.authorization !== undefined,
  }),

  // Cache static data for 24 hours
  staticData: cache({
    ttl: 86400,
    keyPrefix: 'static:',
  }),

  // Cache search results for 15 minutes
  searchResults: cache({
    ttl: 900,
    keyPrefix: 'search:',
    generateKey: (req) => `${req.query.q}:${req.query.page || 1}`,
    skipCache: (req) => !req.query.q,
  }),
};

// Cache warming functions
export const warmCache = {
  // Warm frequently accessed data
  async warmFrequentData() {
    try {
      logger.info('Starting cache warming for frequent data');
      
      // Add your cache warming logic here
      // Example: Pre-load popular user data, templates, etc.
      
      logger.info('Cache warming completed');
    } catch (error: any) {
      logger.error('Cache warming failed', { error: error.message });
    }
  },

  // Warm cache on application startup
  async onStartup() {
    await this.warmFrequentData();
  },
};

// Cache statistics
export const getCacheStats = async () => {
  try {
    const info = await redisClient.info('memory');
    const keyspace = await redisClient.info('keyspace');
    
    return {
      memory: info,
      keyspace: keyspace,
      connected: redisClient.isReady,
    };
  } catch (error: any) {
    logger.error('Failed to get cache stats', { error: error.message });
    return { error: error.message };
  }
};

export { redisClient };