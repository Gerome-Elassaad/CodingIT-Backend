import { Request, Response, NextFunction } from 'express';
declare const redisClient: any;
interface CacheOptions {
    ttl?: number;
    keyPrefix?: string;
    skipCache?: (req: Request) => boolean;
    generateKey?: (req: Request) => string;
}
export declare const cache: (options?: CacheOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const invalidateCache: (patterns: string[]) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const cacheConfigs: {
    userData: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    apiResponse: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    staticData: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    searchResults: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
};
export declare const warmCache: {
    warmFrequentData(): Promise<void>;
    onStartup(): Promise<void>;
};
export declare const getCacheStats: () => Promise<{
    memory: any;
    keyspace: any;
    connected: any;
    error?: undefined;
} | {
    error: any;
    memory?: undefined;
    keyspace?: undefined;
    connected?: undefined;
}>;
export { redisClient };
