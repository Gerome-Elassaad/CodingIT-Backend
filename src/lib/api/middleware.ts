import { Request, Response, NextFunction } from 'express'

export interface MiddlewareContext {
  request: Request
  response: Response
}

export function createPublicApiRoute(
  handler: (context: MiddlewareContext) => Promise<any>,
  options?: any
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler({ request: req, response: res })
    } catch (error) {
      next(error)
    }
  }
}

export function createProtectedApiRoute(
  handler: (context: MiddlewareContext) => Promise<any>,
  options?: any
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler({ request: req, response: res })
    } catch (error) {
      next(error)
    }
  }
}

export function createRateLimitedApiRoute(
  handler: (context: MiddlewareContext) => Promise<any>,
  rateLimitOptions?: any,
  options?: any
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler({ request: req, response: res })
    } catch (error) {
      next(error)
    }
  }
}