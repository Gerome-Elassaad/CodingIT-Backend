interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
    amount: number;
}
export default function ratelimit(identifier: string | null, maxRequests: number, windowMs: number): Promise<RateLimitResult | false>;
export {};
