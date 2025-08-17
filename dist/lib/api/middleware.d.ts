import { Request, Response, NextFunction } from 'express';
export interface MiddlewareContext {
    request: Request;
    response: Response;
}
export declare function createPublicApiRoute(handler: (context: MiddlewareContext) => Promise<any>, options?: any): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare function createProtectedApiRoute(handler: (context: MiddlewareContext) => Promise<any>, options?: any): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare function createRateLimitedApiRoute(handler: (context: MiddlewareContext) => Promise<any>, rateLimitOptions?: any, options?: any): (req: Request, res: Response, next: NextFunction) => Promise<void>;
