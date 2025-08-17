import { Response } from 'express';
export interface ApiSuccessResponse<T = any> {
    success: true;
    data: T;
    timestamp: string;
    requestId?: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    };
}
export interface ApiErrorResponse {
    success: false;
    error: {
        message: string;
        code: string;
        details?: any;
        stack?: string;
    };
    timestamp: string;
    requestId?: string;
}
export declare function createSuccessResponse<T>(data: T, options?: {
    statusCode?: number;
    requestId?: string;
    pagination?: ApiSuccessResponse['pagination'];
}): Response;
export declare function createErrorResponse(message: string, options?: {
    statusCode?: number;
    code?: string;
    details?: any;
    requestId?: string;
    includeStack?: boolean;
}): Response;
export declare function createPaginatedResponse<T>(data: T[], pagination: {
    page: number;
    limit: number;
    total: number;
}, options?: {
    statusCode?: number;
    requestId?: string;
}): Response;
export declare function createStreamResponse(stream: ReadableStream, options?: {
    contentType?: string;
    headers?: Record<string, string>;
}): Response;
export declare function notFound(resource?: string): Response;
export declare function unauthorized(message?: string): Response;
export declare function forbidden(message?: string): Response;
export declare function badRequest(message?: string, details?: any): Response;
export declare function rateLimitExceeded(retryAfter?: number): Response;
export declare function internalServerError(message?: string): Response;
