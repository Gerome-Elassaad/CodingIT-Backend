import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { ApiException } from './errors'

export interface ApiRequest extends Request {
  user?: any
  team?: any
  rateLimitInfo?: {
    remaining: number
    reset: number
    limit: number
  }
}

export interface ApiResponse extends Response {
  success: (data: any, statusCode?: number) => Response
  error: (message: string, statusCode?: number, details?: any) => Response
}

// Request validation middleware
export function validateRequest(schema: z.ZodSchema) {
  return (req: ApiRequest, res: ApiResponse, next: NextFunction) => {
    try {
      const validation = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers
      })

      if (!validation.success) {
        return res.error('Validation failed', 400, validation.error.issues)
      }

      req.body = validation.data.body || req.body
      req.query = validation.data.query || req.query
      req.params = validation.data.params || req.params
      
      next()
    } catch (error) {
      next(error)
    }
  }
}

// Authentication middleware
export function requireAuth() {
  return async (req: ApiRequest, res: ApiResponse, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.error('Authentication required', 401)
      }

      const token = authHeader.substring(7)
      
      // Validate token with Supabase or your auth service
      // This is a placeholder - implement your actual auth logic
      const user = await validateAuthToken(token)
      
      if (!user) {
        return res.error('Invalid or expired token', 401)
      }

      req.user = user
      next()
    } catch (error) {
      next(error)
    }
  }
}

// Rate limiting middleware
export function rateLimit(maxRequests: number, windowMs: number) {
  const requests = new Map<string, { count: number; resetTime: number }>()

  return (req: ApiRequest, res: ApiResponse, next: NextFunction) => {
    const clientId = req.ip || req.headers['x-forwarded-for'] as string || 'unknown'
    const now = Date.now()
    const windowStart = now - windowMs

    // Clean up old entries
    for (const [key, value] of requests.entries()) {
      if (value.resetTime < windowStart) {
        requests.delete(key)
      }
    }

    const clientRequests = requests.get(clientId) || { count: 0, resetTime: now + windowMs }
    
    if (clientRequests.count >= maxRequests && clientRequests.resetTime > now) {
      const resetTime = Math.ceil((clientRequests.resetTime - now) / 1000)
      
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': resetTime.toString()
      })
      
      return res.error('Rate limit exceeded', 429, {
        retryAfter: resetTime
      })
    }

    clientRequests.count++
    requests.set(clientId, clientRequests)

    req.rateLimitInfo = {
      remaining: Math.max(0, maxRequests - clientRequests.count),
      reset: Math.ceil((clientRequests.resetTime - now) / 1000),
      limit: maxRequests
    }

    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': req.rateLimitInfo.remaining.toString(),
      'X-RateLimit-Reset': req.rateLimitInfo.reset.toString()
    })

    next()
  }
}

// Response helpers middleware
export function responseHelpers() {
  return (req: Request, res: ApiResponse, next: NextFunction) => {
    res.success = function(data: any, statusCode: number = 200) {
      return this.status(statusCode).json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || generateRequestId()
      })
    }

    res.error = function(message: string, statusCode: number = 500, details?: any) {
      return this.status(statusCode).json({
        success: false,
        error: {
          message,
          details,
          code: getErrorCode(statusCode)
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || generateRequestId()
      })
    }

    next()
  }
}

// Request logging middleware
export function requestLogger() {
  return (req: ApiRequest, res: ApiResponse, next: NextFunction) => {
    const startTime = Date.now()
    const requestId = req.headers['x-request-id'] || generateRequestId()
    
    // Add request ID to headers
    req.headers['x-request-id'] = requestId
    res.set('X-Request-ID', requestId)

    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`, {
      requestId,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      userId: req.user?.id
    })

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - startTime
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode}`, {
        requestId,
        duration: `${duration}ms`,
        statusCode: res.statusCode
      })
    })

    next()
  }
}

// Error handling middleware
export function errorHandler() {
  return (error: Error, req: ApiRequest, res: ApiResponse, next: NextFunction) => {
    console.error('API Error:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      userId: req.user?.id,
      requestId: req.headers['x-request-id']
    })

    if (error instanceof ApiException) {
      return res.error(error.message, error.statusCode, error.details)
    }

    if (error.name === 'ValidationError') {
      return res.error('Validation failed', 400, error.message)
    }

    if (error.name === 'UnauthorizedError') {
      return res.error('Unauthorized', 401)
    }

    // Default error response
    return res.error(
      process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message,
      500
    )
  }
}

// Utility functions
async function validateAuthToken(token: string): Promise<any> {
  // Implement your token validation logic here
  // This could be JWT validation, Supabase auth, etc.
  return null
}

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}

function getErrorCode(statusCode: number): string {
  const codes: Record<number, string> = {
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
  }
  return codes[statusCode] || 'UNKNOWN_ERROR'
}