import { Request, Response, NextFunction } from 'express';
export declare const securityHeaders: any;
export declare const advancedRateLimit: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const apiKeyAuth: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const jwtAuth: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const sanitizeInput: (req: Request, res: Response, next: NextFunction) => void;
export declare const requestSizeLimit: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requestTimeout: (req: Request, res: Response, next: NextFunction) => void;
