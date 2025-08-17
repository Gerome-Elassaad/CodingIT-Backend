"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeClient = exports.githubClient = exports.ExternalApiError = exports.ExternalApiClient = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
class ExternalApiClient {
    constructor(config) {
        this.config = {
            timeout: 30000,
            retries: 3,
            retryDelay: 1000,
            ...config
        };
    }
    async request(endpoint, options = {}) {
        const url = `${this.config.baseURL}${endpoint}`;
        const method = options.method || 'GET';
        const timeout = options.timeout || this.config.timeout;
        const maxRetries = options.retries ?? this.config.retries;
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'CodingIT-Backend/1.0',
            ...this.config.headers,
            ...options.headers
        };
        if (this.config.apiKey) {
            headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        }
        const requestConfig = {
            method,
            headers,
            timeout
        };
        if (options.body && method !== 'GET') {
            requestConfig.body = typeof options.body === 'string'
                ? options.body
                : JSON.stringify(options.body);
        }
        let lastError;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                console.log(`[External API] ${method} ${url} (attempt ${attempt + 1}/${maxRetries + 1})`);
                const response = await (0, node_fetch_1.default)(url, requestConfig);
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new ExternalApiError(`HTTP ${response.status}: ${response.statusText}`, response.status, errorText);
                }
                const contentType = response.headers.get('content-type');
                let data;
                if (contentType?.includes('application/json')) {
                    data = await response.json();
                }
                else {
                    data = await response.text();
                }
                console.log(`[External API] ${method} ${url} - Success (${response.status})`);
                return data;
            }
            catch (error) {
                lastError = error;
                console.error(`[External API] ${method} ${url} - Error (attempt ${attempt + 1}):`, error.message);
                // Don't retry on client errors (4xx) except 429 (rate limit)
                if (error instanceof ExternalApiError &&
                    error.statusCode >= 400 &&
                    error.statusCode < 500 &&
                    error.statusCode !== 429) {
                    throw error;
                }
                // Don't retry on the last attempt
                if (attempt === maxRetries) {
                    throw error;
                }
                // Wait before retrying
                await this.delay(this.config.retryDelay * Math.pow(2, attempt));
            }
        }
        throw lastError;
    }
    async get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }
    async post(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'POST', body });
    }
    async put(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PUT', body });
    }
    async delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
    async patch(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PATCH', body });
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.ExternalApiClient = ExternalApiClient;
class ExternalApiError extends Error {
    constructor(message, statusCode, responseBody) {
        super(message);
        this.statusCode = statusCode;
        this.responseBody = responseBody;
        this.name = 'ExternalApiError';
    }
}
exports.ExternalApiError = ExternalApiError;
// Pre-configured clients for common services
exports.githubClient = new ExternalApiClient({
    baseURL: 'https://api.github.com',
    headers: {
        'Accept': 'application/vnd.github.v3+json'
    }
});
exports.stripeClient = new ExternalApiClient({
    baseURL: 'https://api.stripe.com/v1',
    apiKey: process.env.STRIPE_SECRET_KEY,
    headers: {
        'Stripe-Version': '2023-10-16'
    }
});
//# sourceMappingURL=external-client.js.map