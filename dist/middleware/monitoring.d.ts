import { Request, Response, NextFunction } from 'express';
declare const logger: any;
export declare const requestLogger: (req: Request, res: Response, next: NextFunction) => void;
export declare const errorLogger: (error: Error, req: Request, res: Response, next: NextFunction) => void;
export declare const healthCheck: (req: Request, res: Response) => Response<any, Record<string, any>> | undefined;
export declare const performanceMonitor: (req: Request, res: Response, next: NextFunction) => void;
export declare const metricsCollector: (req: Request, res: Response, next: NextFunction) => void;
export declare const getMetrics: (req: Request, res: Response) => void;
export { logger };
