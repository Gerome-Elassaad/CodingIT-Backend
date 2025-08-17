export declare class ApiException extends Error {
    type: string;
    statusCode: number;
    details?: string | undefined;
    constructor(message: string, type: string, statusCode?: number, details?: string | undefined);
}
export declare function createErrorResponse(error: ApiException): {
    error: string;
    type: string;
    statusCode: number;
};
export declare function createAuthenticationError(message?: string): ApiException;
export declare function createValidationError(message?: string): ApiException;
export declare function createConfigError(message?: string): ApiException;
export declare function handleDatabaseError(error: any): ApiException;
export declare function handleAIProviderError(error: any): ApiException;
export declare function handleE2BError(error: any): ApiException;
