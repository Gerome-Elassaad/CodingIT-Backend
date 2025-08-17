"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiException = void 0;
exports.createErrorResponse = createErrorResponse;
exports.createAuthenticationError = createAuthenticationError;
exports.createValidationError = createValidationError;
exports.createConfigError = createConfigError;
exports.handleDatabaseError = handleDatabaseError;
exports.handleAIProviderError = handleAIProviderError;
exports.handleE2BError = handleE2BError;
class ApiException extends Error {
    constructor(message, type, statusCode = 500, details) {
        super(message);
        this.type = type;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'ApiException';
    }
}
exports.ApiException = ApiException;
function createErrorResponse(error) {
    return {
        error: error.message,
        type: error.type,
        statusCode: error.statusCode
    };
}
function createAuthenticationError(message = 'Unauthorized') {
    return new ApiException(message, 'authentication_error', 401);
}
function createValidationError(message = 'Validation failed') {
    return new ApiException(message, 'validation_error', 400);
}
function createConfigError(message = 'Configuration error') {
    return new ApiException(message, 'configuration_error', 500);
}
function handleDatabaseError(error) {
    return new ApiException('Database operation failed', 'database_error', 500, error.message);
}
function handleAIProviderError(error) {
    return new ApiException(error.message || 'AI provider error', 'ai_provider_error', error.statusCode || 500);
}
function handleE2BError(error) {
    return new ApiException(error.message || 'Sandbox error', 'sandbox_error', 500);
}
//# sourceMappingURL=errors.js.map