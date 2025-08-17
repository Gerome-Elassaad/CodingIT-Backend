import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
export interface ApiRequest extends Request {
    user?: any;
    team?: any;
    rateLimitInfo?: {
        remaining: number;
        reset: number;
        limit: number;
    };
}
export interface ApiResponse extends Response {
    success: (data: any, statusCode?: number) => Response;
    error: (message: string, statusCode?: number, details?: any) => Response;
}
export declare function validateRequest(schema: z.ZodSchema): (req: ApiRequest, res: ApiResponse, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare function requireAuth(): (req: ApiRequest, res: ApiResponse, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare function rateLimit(maxRequests: number, windowMs: number): (req: ApiRequest, res: ApiResponse, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare function responseHelpers(): (req: Request, res: ApiResponse, next: NextFunction) => void;
export declare function requestLogger(): (req: ApiRequest, res: ApiResponse, next: NextFunction) => void;
export declare function errorHandler(): (error: Error, req: ApiRequest, res: ApiResponse, next: NextFunction) => Response<any, Record<string, any>>;
