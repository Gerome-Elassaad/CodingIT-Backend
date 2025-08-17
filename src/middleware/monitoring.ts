import { Request, Response, NextFunction } from 'express';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { productionConfig } from '../config/production';
import * as Sentry from '@sentry/node';
import { performance } from 'perf_hooks';

// Initialize Sentry for error tracking
if (productionConfig.monitoring.sentryDsn) {
  Sentry.init({
    dsn: productionConfig.monitoring.sentryDsn,
    environment: productionConfig.server.nodeEnv,
    tracesSampleRate: 0.1,
  });
}

// Configure Winston logger
const logger = winston.createLogger({
  level: productionConfig.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'codinit-backend' },
  transports: [
    // Error log file
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: productionConfig.logging.datePattern,
      level: 'error',
      maxFiles: productionConfig.logging.maxFiles,
      maxSize: productionConfig.logging.maxSize,
    }),
    // Combined log file
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: productionConfig.logging.datePattern,
      maxFiles: productionConfig.logging.maxFiles,
      maxSize: productionConfig.logging.maxSize,
    }),
    // Console output for development
    ...(productionConfig.server.nodeEnv !== 'production' ? [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ] : [])
  ],
});

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = performance.now();
  const requestId = generateRequestId();
  
  // Add request ID to request and response
  (req as any).requestId = requestId;
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
    const duration = performance.now() - startTime;
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

// Error logging middleware
export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction) => {
  const requestId = (req as any).requestId;
  
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
  if (productionConfig.monitoring.sentryDsn) {
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

// Health check endpoint
export const healthCheck = (req: Request, res: Response) => {
  const healthCheckToken = req.headers['x-health-check-token'];
  
  if (healthCheckToken !== productionConfig.monitoring.healthCheckToken) {
    return res.status(401).json({ error: 'Unauthorized health check' });
  }

  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
    environment: productionConfig.server.nodeEnv,
    checks: {
      database: 'healthy', // Implement actual database check
      redis: 'healthy',    // Implement actual Redis check
      external_apis: 'healthy', // Implement external API checks
    },
  };

  logger.info('Health check performed', { requestId: (req as any).requestId });
  res.json(healthStatus);
};

// Performance monitoring middleware
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  if (!productionConfig.monitoring.performanceTracking) {
    return next();
  }

  const startTime = performance.now();
  const startMemory = process.memoryUsage();

  res.on('finish', () => {
    const duration = performance.now() - startTime;
    const endMemory = process.memoryUsage();
    
    // Log slow requests
    if (duration > 1000) { // Log requests taking more than 1 second
      logger.warn('Slow request detected', {
        requestId: (req as any).requestId,
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

// Metrics collection
interface Metrics {
  requests: { [key: string]: number };
  responses: { [key: string]: number };
  errors: { [key: string]: number };
  performance: { total: number; average: number };
}

const metrics: Metrics = {
  requests: {},
  responses: {},
  errors: {},
  performance: { total: 0, average: 0 },
};

export const metricsCollector = (req: Request, res: Response, next: NextFunction) => {
  if (!productionConfig.monitoring.metricsEnabled) {
    return next();
  }

  const startTime = performance.now();
  const route = `${req.method} ${req.route?.path || req.path}`;

  // Count requests
  metrics.requests[route] = (metrics.requests[route] || 0) + 1;

  res.on('finish', () => {
    const duration = performance.now() - startTime;
    
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

// Metrics endpoint
export const getMetrics = (req: Request, res: Response) => {
  res.json({
    ...metrics,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
};

// Helper function to generate request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export { logger };