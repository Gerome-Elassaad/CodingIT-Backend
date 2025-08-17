"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.getMetrics = exports.metricsCollector = exports.performanceMonitor = exports.healthCheck = exports.errorLogger = exports.requestLogger = void 0;
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const production_1 = require("../config/production");
const Sentry = __importStar(require("@sentry/node"));
const perf_hooks_1 = require("perf_hooks");
// Initialize Sentry for error tracking
if (production_1.productionConfig.monitoring.sentryDsn) {
    Sentry.init({
        dsn: production_1.productionConfig.monitoring.sentryDsn,
        environment: production_1.productionConfig.server.nodeEnv,
        tracesSampleRate: 0.1,
    });
}
// Configure Winston logger
const logger = winston_1.default.createLogger({
    level: production_1.productionConfig.logging.level,
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    defaultMeta: { service: 'codinit-backend' },
    transports: [
        // Error log file
        new winston_daily_rotate_file_1.default({
            filename: 'logs/error-%DATE%.log',
            datePattern: production_1.productionConfig.logging.datePattern,
            level: 'error',
            maxFiles: production_1.productionConfig.logging.maxFiles,
            maxSize: production_1.productionConfig.logging.maxSize,
        }),
        // Combined log file
        new winston_daily_rotate_file_1.default({
            filename: 'logs/combined-%DATE%.log',
            datePattern: production_1.productionConfig.logging.datePattern,
            maxFiles: production_1.productionConfig.logging.maxFiles,
            maxSize: production_1.productionConfig.logging.maxSize,
        }),
        // Console output for development
        ...(production_1.productionConfig.server.nodeEnv !== 'production' ? [
            new winston_1.default.transports.Console({
                format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
            })
        ] : [])
    ],
});
exports.logger = logger;
// Request logging middleware
const requestLogger = (req, res, next) => {
    const startTime = perf_hooks_1.performance.now();
    const requestId = generateRequestId();
    // Add request ID to request and response
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    // Log incoming request
    logger.info('Incoming request', {
        requestId,
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        timestamp: new Date().toISOString(),
    });
    // Log response when finished
    res.on('finish', () => {
        const duration = perf_hooks_1.performance.now() - startTime;
        const logLevel = res.statusCode >= 400 ? 'error' : 'info';
        logger.log(logLevel, 'Request completed', {
            requestId,
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration.toFixed(2)}ms`,
            contentLength: res.getHeader('content-length'),
            timestamp: new Date().toISOString(),
        });
    });
    next();
};
exports.requestLogger = requestLogger;
// Error logging middleware
const errorLogger = (error, req, res, next) => {
    const requestId = req.requestId;
    // Log error details
    logger.error('Request error', {
        requestId,
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
        },
        request: {
            method: req.method,
            url: req.url,
            headers: req.headers,
            body: req.body,
        },
        timestamp: new Date().toISOString(),
    });
    // Send error to Sentry
    if (production_1.productionConfig.monitoring.sentryDsn) {
        Sentry.withScope((scope) => {
            scope.setTag('requestId', requestId);
            scope.setContext('request', {
                method: req.method,
                url: req.url,
                headers: req.headers,
            });
            Sentry.captureException(error);
        });
    }
    next(error);
};
exports.errorLogger = errorLogger;
// Health check endpoint
const healthCheck = (req, res) => {
    const healthCheckToken = req.headers['x-health-check-token'];
    if (healthCheckToken !== production_1.productionConfig.monitoring.healthCheckToken) {
        return res.status(401).json({ error: 'Unauthorized health check' });
    }
    const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0',
        environment: production_1.productionConfig.server.nodeEnv,
        checks: {
            database: 'healthy', // Implement actual database check
            redis: 'healthy', // Implement actual Redis check
            external_apis: 'healthy', // Implement external API checks
        },
    };
    logger.info('Health check performed', { requestId: req.requestId });
    res.json(healthStatus);
};
exports.healthCheck = healthCheck;
// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
    if (!production_1.productionConfig.monitoring.performanceTracking) {
        return next();
    }
    const startTime = perf_hooks_1.performance.now();
    const startMemory = process.memoryUsage();
    res.on('finish', () => {
        const duration = perf_hooks_1.performance.now() - startTime;
        const endMemory = process.memoryUsage();
        // Log slow requests
        if (duration > 1000) { // Log requests taking more than 1 second
            logger.warn('Slow request detected', {
                requestId: req.requestId,
                method: req.method,
                url: req.url,
                duration: `${duration.toFixed(2)}ms`,
                memoryDelta: {
                    rss: endMemory.rss - startMemory.rss,
                    heapUsed: endMemory.heapUsed - startMemory.heapUsed,
                },
            });
        }
    });
    next();
};
exports.performanceMonitor = performanceMonitor;
const metrics = {
    requests: {},
    responses: {},
    errors: {},
    performance: { total: 0, average: 0 },
};
const metricsCollector = (req, res, next) => {
    if (!production_1.productionConfig.monitoring.metricsEnabled) {
        return next();
    }
    const startTime = perf_hooks_1.performance.now();
    const route = `${req.method} ${req.route?.path || req.path}`;
    // Count requests
    metrics.requests[route] = (metrics.requests[route] || 0) + 1;
    res.on('finish', () => {
        const duration = perf_hooks_1.performance.now() - startTime;
        // Count responses by status code
        const statusGroup = `${Math.floor(res.statusCode / 100)}xx`;
        metrics.responses[statusGroup] = (metrics.responses[statusGroup] || 0) + 1;
        // Count errors
        if (res.statusCode >= 400) {
            metrics.errors[route] = (metrics.errors[route] || 0) + 1;
        }
        // Update performance metrics
        metrics.performance.total += duration;
        const totalRequests = Object.values(metrics.requests).reduce((a, b) => a + b, 0);
        metrics.performance.average = metrics.performance.total / totalRequests;
    });
    next();
};
exports.metricsCollector = metricsCollector;
// Metrics endpoint
const getMetrics = (req, res) => {
    res.json({
        ...metrics,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
    });
};
exports.getMetrics = getMetrics;
// Helper function to generate request ID
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
//# sourceMappingURL=monitoring.js.map