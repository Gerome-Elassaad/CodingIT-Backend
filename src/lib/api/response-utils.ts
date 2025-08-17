import { Response } from 'express'

export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  timestamp: string
  requestId?: string
  pagination?: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

export interface ApiErrorResponse {
  success: false
  error: {
    message: string
    code: string
    details?: any
    stack?: string
  }
  timestamp: string
  requestId?: string
}

export function createSuccessResponse<T>(
  data: T, 
  options: {
    statusCode?: number
    requestId?: string
    pagination?: ApiSuccessResponse['pagination']
  } = {}
): Response {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    ...(options.requestId && { requestId: options.requestId }),
    ...(options.pagination && { pagination: options.pagination })
  }

  return new Response(JSON.stringify(response), {
    status: options.statusCode || 200,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

export function createErrorResponse(
  message: string,
  options: {
    statusCode?: number
    code?: string
    details?: any
    requestId?: string
    includeStack?: boolean
  } = {}
): Response {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      message,
      code: options.code || getErrorCodeFromStatus(options.statusCode || 500),
      ...(options.details && { details: options.details }),
      ...(options.includeStack && process.env.NODE_ENV === 'development' && { 
        stack: new Error().stack 
      })
    },
    timestamp: new Date().toISOString(),
    ...(options.requestId && { requestId: options.requestId })
  }

  return new Response(JSON.stringify(response), {
    status: options.statusCode || 500,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    page: number
    limit: number
    total: number
  },
  options: {
    statusCode?: number
    requestId?: string
  } = {}
): Response {
  const hasMore = (pagination.page * pagination.limit) < pagination.total

  return createSuccessResponse(data, {
    ...options,
    pagination: {
      ...pagination,
      hasMore
    }
  })
}

export function createStreamResponse(
  stream: ReadableStream,
  options: {
    contentType?: string
    headers?: Record<string, string>
  } = {}
): Response {
  return new Response(stream, {
    headers: {
      'Content-Type': options.contentType || 'text/plain',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...options.headers
    }
  })
}

function getErrorCodeFromStatus(statusCode: number): string {
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

// Utility functions for common response patterns
export function notFound(resource: string = 'Resource'): Response {
  return createErrorResponse(`${resource} not found`, {
    statusCode: 404,
    code: 'NOT_FOUND'
  })
}

export function unauthorized(message: string = 'Authentication required'): Response {
  return createErrorResponse(message, {
    statusCode: 401,
    code: 'UNAUTHORIZED'
  })
}

export function forbidden(message: string = 'Access denied'): Response {
  return createErrorResponse(message, {
    statusCode: 403,
    code: 'FORBIDDEN'
  })
}

export function badRequest(message: string = 'Invalid request', details?: any): Response {
  return createErrorResponse(message, {
    statusCode: 400,
    code: 'BAD_REQUEST',
    details
  })
}

export function rateLimitExceeded(retryAfter?: number): Response {
  return createErrorResponse('Rate limit exceeded', {
    statusCode: 429,
    code: 'RATE_LIMIT_EXCEEDED',
    details: retryAfter ? { retryAfter } : undefined
  })
}

export function internalServerError(message: string = 'Internal server error'): Response {
  return createErrorResponse(message, {
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR'
  })
}