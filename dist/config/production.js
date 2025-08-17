"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productionConfig = void 0;
exports.validateConfig = validateConfig;
const dotenv_1 = require("dotenv");
const path_1 = __importDefault(require("path"));
// Load environment variables
(0, dotenv_1.config)({ path: path_1.default.resolve(process.cwd(), '.env.production') });
exports.productionConfig = {
    // Server Configuration
    server: {
        port: parseInt(process.env.PORT || '3001'),
        host: process.env.HOST || '0.0.0.0',
        nodeEnv: process.env.NODE_ENV || 'production',
        apiVersion: process.env.API_VERSION || 'v1',
        maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb',
        requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000'),
    },
    // Database Configuration
    database: {
        url: process.env.DATABASE_URL,
        supabase: {
            url: process.env.SUPABASE_URL,
            anonKey: process.env.SUPABASE_ANON_KEY,
            serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        },
        pool: {
            min: parseInt(process.env.DATABASE_POOL_MIN || '2'),
            max: parseInt(process.env.DATABASE_POOL_MAX || '20'),
        },
    },
    // Redis Configuration
    redis: {
        url: process.env.REDIS_URL,
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
    },
    // Security Configuration
    security: {
        jwtSecret: process.env.JWT_SECRET,
        encryptionKey: process.env.ENCRYPTION_KEY,
        sessionSecret: process.env.SESSION_SECRET,
        bcryptRounds: 12,
        jwtExpiresIn: '24h',
        refreshTokenExpiresIn: '7d',
    },
    // CORS Configuration
    cors: {
        origins: process.env.ALLOWED_ORIGINS?.split(',') || [],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'X-API-Key',
            'X-Request-ID',
        ],
        exposedHeaders: ['X-Request-ID', 'X-RateLimit-Remaining'],
    },
    // Rate Limiting
    rateLimit: {
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
        windowMs: parseTimeWindow(process.env.RATE_LIMIT_WINDOW || '15m'),
        redisPrefix: process.env.RATE_LIMIT_REDIS_PREFIX || 'rl:',
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
    },
    // SSL Configuration
    ssl: {
        enabled: process.env.NODE_ENV === 'production',
        certPath: process.env.SSL_CERT_PATH,
        keyPath: process.env.SSL_KEY_PATH,
    },
    // Logging Configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: 'json',
        maxFiles: 10,
        maxSize: '20m',
        datePattern: 'YYYY-MM-DD',
    },
    // Monitoring
    monitoring: {
        sentryDsn: process.env.SENTRY_DSN,
        healthCheckToken: process.env.HEALTH_CHECK_TOKEN,
        metricsEnabled: true,
        performanceTracking: true,
    },
    // External Services
    services: {
        openai: { apiKey: process.env.OPENAI_API_KEY },
        anthropic: { apiKey: process.env.ANTHROPIC_API_KEY },
        google: { apiKey: process.env.GOOGLE_AI_API_KEY },
        e2b: { apiKey: process.env.E2B_API_KEY },
        stripe: {
            secretKey: process.env.STRIPE_SECRET_KEY,
            webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            webhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
        },
    },
};
function parseTimeWindow(window) {
    const units = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
    };
    const match = window.match(/^(\d+)([smhd])$/);
    if (!match)
        return 15 * 60 * 1000; // Default 15 minutes
    const [, amount, unit] = match;
    return parseInt(amount) * units[unit];
}
// Validate required environment variables
function validateConfig() {
    const required = [
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'JWT_SECRET',
        'ENCRYPTION_KEY',
        'SESSION_SECRET',
    ];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}
//# sourceMappingURL=production.js.map