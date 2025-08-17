interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  amount: number
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export default async function ratelimit(
  identifier: string | null,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult | false> {
  if (!identifier) {
    return false
  }

  const now = Date.now()
  const key = `ratelimit:${identifier}`
  
  // Clean up expired entries
  for (const [k, v] of rateLimitStore.entries()) {
    if (v.resetTime < now) {
      rateLimitStore.delete(k)
    }
  }

  const current = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs }
  
  if (current.count >= maxRequests && current.resetTime > now) {
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      reset: Math.ceil((current.resetTime - now) / 1000),
      amount: maxRequests
    }
  }

  current.count++
  rateLimitStore.set(key, current)

  return {
    success: true,
    limit: maxRequests,
    remaining: Math.max(0, maxRequests - current.count),
    reset: Math.ceil((current.resetTime - now) / 1000),
    amount: maxRequests
  }
}