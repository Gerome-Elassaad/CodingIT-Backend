import fetch from 'node-fetch'

export interface ExternalApiConfig {
  baseURL: string
  timeout?: number
  retries?: number
  retryDelay?: number
  headers?: Record<string, string>
  apiKey?: string
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  timeout?: number
  retries?: number
}

export class ExternalApiClient {
  private config: ExternalApiConfig

  constructor(config: ExternalApiConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      ...config
    }
  }

  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.config.baseURL}${endpoint}`
    const method = options.method || 'GET'
    const timeout = options.timeout || this.config.timeout!
    const maxRetries = options.retries ?? this.config.retries!

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'CodingIT-Backend/1.0',
      ...this.config.headers,
      ...options.headers
    }

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`
    }

    const requestConfig: any = {
      method,
      headers,
      timeout
    }

    if (options.body && method !== 'GET') {
      requestConfig.body = typeof options.body === 'string' 
        ? options.body 
        : JSON.stringify(options.body)
    }

    let lastError: Error
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[External API] ${method} ${url} (attempt ${attempt + 1}/${maxRetries + 1})`)
        
        const response = await fetch(url, requestConfig)
        
        if (!response.ok) {
          const errorText = await response.text()
          throw new ExternalApiError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            errorText
          )
        }

        const contentType = response.headers.get('content-type')
        let data: T

        if (contentType?.includes('application/json')) {
          data = await response.json() as T
        } else {
          data = await response.text() as T
        }

        console.log(`[External API] ${method} ${url} - Success (${response.status})`)
        return data

      } catch (error: any) {
        lastError = error
        console.error(`[External API] ${method} ${url} - Error (attempt ${attempt + 1}):`, error.message)

        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (error instanceof ExternalApiError && 
            error.statusCode >= 400 && 
            error.statusCode < 500 && 
            error.statusCode !== 429) {
          throw error
        }

        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          throw error
        }

        // Wait before retrying
        await this.delay(this.config.retryDelay! * Math.pow(2, attempt))
      }
    }

    throw lastError!
  }

  async get<T = any>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T = any>(endpoint: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body })
  }

  async put<T = any>(endpoint: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body })
  }

  async delete<T = any>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  async patch<T = any>(endpoint: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body })
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export class ExternalApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public responseBody?: string
  ) {
    super(message)
    this.name = 'ExternalApiError'
  }
}

// Pre-configured clients for common services
export const githubClient = new ExternalApiClient({
  baseURL: 'https://api.github.com',
  headers: {
    'Accept': 'application/vnd.github.v3+json'
  }
})

export const stripeClient = new ExternalApiClient({
  baseURL: 'https://api.stripe.com/v1',
  apiKey: process.env.STRIPE_SECRET_KEY,
  headers: {
    'Stripe-Version': '2023-10-16'
  }
})