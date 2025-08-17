export class ApiException extends Error {
  constructor(
    message: string,
    public type: string,
    public statusCode: number = 500,
    public details?: string
  ) {
    super(message)
    this.name = 'ApiException'
  }
}

export function createErrorResponse(error: ApiException) {
  return {
    error: error.message,
    type: error.type,
    statusCode: error.statusCode
  }
}

export function createAuthenticationError(message = 'Unauthorized') {
  return new ApiException(message, 'authentication_error', 401)
}

export function createValidationError(message = 'Validation failed') {
  return new ApiException(message, 'validation_error', 400)
}

export function createConfigError(message = 'Configuration error') {
  return new ApiException(message, 'configuration_error', 500)
}

export function handleDatabaseError(error: any) {
  return new ApiException(
    'Database operation failed',
    'database_error',
    500,
    error.message
  )
}

export function handleAIProviderError(error: any) {
  return new ApiException(
    error.message || 'AI provider error',
    'ai_provider_error',
    error.statusCode || 500
  )
}

export function handleE2BError(error: any) {
  return new ApiException(
    error.message || 'Sandbox error',
    'sandbox_error',
    500
  )
}