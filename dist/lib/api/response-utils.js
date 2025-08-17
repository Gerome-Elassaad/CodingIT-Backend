"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSuccessResponse = createSuccessResponse;
exports.createErrorResponse = createErrorResponse;
exports.createPaginatedResponse = createPaginatedResponse;
exports.createStreamResponse = createStreamResponse;
exports.notFound = notFound;
exports.unauthorized = unauthorized;
exports.forbidden = forbidden;
exports.badRequest = badRequest;
exports.rateLimitExceeded = rateLimitExceeded;
exports.internalServerError = internalServerError;
function createSuccessResponse(data, options = {}) {
    const response = {
        success: true,
        data,
        timestamp: new Date().toISOString(),
        ...(options.requestId && { requestId: options.requestId }),
        ...(options.pagination && { pagination: options.pagination })
    };
    return new Response(JSON.stringify(response), {
        status: options.statusCode || 200,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}
function createErrorResponse(message, options = {}) {
    const response = {
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
    };
    return new Response(JSON.stringify(response), {
        status: options.statusCode || 500,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}
function createPaginatedResponse(data, pagination, options = {}) {
    const hasMore = (pagination.page * pagination.limit) < pagination.total;
    return createSuccessResponse(data, {
        ...options,
        pagination: {
            ...pagination,
            hasMore
        }
    });
}
function createStreamResponse(stream, options = {}) {
    return new Response(stream, {
        headers: {
            'Content-Type': options.contentType || 'text/plain',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            ...options.headers
        }
    });
}
function getErrorCodeFromStatus(statusCode) {
    const codes = {
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
    };
    return codes[statusCode] || 'UNKNOWN_ERROR';
}
// Utility functions for common response patterns
function notFound(resource = 'Resource') {
    return createErrorResponse(`${resource} not found`, {
        statusCode: 404,
        code: 'NOT_FOUND'
    });
}
function unauthorized(message = 'Authentication required') {
    return createErrorResponse(message, {
        statusCode: 401,
        code: 'UNAUTHORIZED'
    });
}
function forbidden(message = 'Access denied') {
    return createErrorResponse(message, {
        statusCode: 403,
        code: 'FORBIDDEN'
    });
}
function badRequest(message = 'Invalid request', details) {
    return createErrorResponse(message, {
        statusCode: 400,
        code: 'BAD_REQUEST',
        details
    });
}
function rateLimitExceeded(retryAfter) {
    return createErrorResponse('Rate limit exceeded', {
        statusCode: 429,
        code: 'RATE_LIMIT_EXCEEDED',
        details: retryAfter ? { retryAfter } : undefined
    });
}
function internalServerError(message = 'Internal server error') {
    return createErrorResponse(message, {
        statusCode: 500,
        code: 'INTERNAL_SERVER_ERROR'
    });
}
//# sourceMappingURL=response-utils.js.map