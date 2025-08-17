export declare const productionConfig: {
    server: {
        port: number;
        host: string;
        nodeEnv: string;
        apiVersion: string;
        maxRequestSize: string;
        requestTimeout: number;
    };
    database: {
        url: string;
        supabase: {
            url: string;
            anonKey: string;
            serviceRoleKey: string;
        };
        pool: {
            min: number;
            max: number;
        };
    };
    redis: {
        url: string;
        password: string | undefined;
        db: number;
        retryDelayOnFailover: number;
        maxRetriesPerRequest: number;
    };
    security: {
        jwtSecret: string;
        encryptionKey: string;
        sessionSecret: string;
        bcryptRounds: number;
        jwtExpiresIn: string;
        refreshTokenExpiresIn: string;
    };
    cors: {
        origins: string[];
        credentials: boolean;
        methods: string[];
        allowedHeaders: string[];
        exposedHeaders: string[];
    };
    rateLimit: {
        maxRequests: number;
        windowMs: number;
        redisPrefix: string;
        skipSuccessfulRequests: boolean;
        skipFailedRequests: boolean;
    };
    ssl: {
        enabled: boolean;
        certPath: string | undefined;
        keyPath: string | undefined;
    };
    logging: {
        level: string;
        format: string;
        maxFiles: number;
        maxSize: string;
        datePattern: string;
    };
    monitoring: {
        sentryDsn: string | undefined;
        healthCheckToken: string | undefined;
        metricsEnabled: boolean;
        performanceTracking: boolean;
    };
    services: {
        openai: {
            apiKey: string | undefined;
        };
        anthropic: {
            apiKey: string | undefined;
        };
        google: {
            apiKey: string | undefined;
        };
        e2b: {
            apiKey: string | undefined;
        };
        stripe: {
            secretKey: string | undefined;
            webhookSecret: string | undefined;
        };
        github: {
            clientId: string | undefined;
            clientSecret: string | undefined;
            webhookSecret: string | undefined;
        };
    };
};
export declare function validateConfig(): void;
