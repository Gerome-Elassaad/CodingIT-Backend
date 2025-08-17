export interface ExternalApiConfig {
    baseURL: string;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    headers?: Record<string, string>;
    apiKey?: string;
}
export interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    body?: any;
    timeout?: number;
    retries?: number;
}
export declare class ExternalApiClient {
    private config;
    constructor(config: ExternalApiConfig);
    request<T = any>(endpoint: string, options?: RequestOptions): Promise<T>;
    get<T = any>(endpoint: string, options?: Omit<RequestOptions, 'method'>): Promise<T>;
    post<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T>;
    put<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T>;
    delete<T = any>(endpoint: string, options?: Omit<RequestOptions, 'method'>): Promise<T>;
    patch<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T>;
    private delay;
}
export declare class ExternalApiError extends Error {
    statusCode: number;
    responseBody?: string | undefined;
    constructor(message: string, statusCode: number, responseBody?: string | undefined);
}
export declare const githubClient: ExternalApiClient;
export declare const stripeClient: ExternalApiClient;
