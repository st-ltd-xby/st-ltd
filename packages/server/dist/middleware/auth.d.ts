import { Request, Response, NextFunction } from 'express';
export interface AuthPayload {
    userId: string;
    tenantId: string;
    role: string;
}
declare global {
    namespace Express {
        interface Request {
            user?: AuthPayload;
        }
    }
}
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>>;
export declare function authorizeRole(allowedRoles: string[]): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare function optionalAuth(req: Request, res: Response, next: NextFunction): void;
export declare function generateToken(payload: AuthPayload): string;
export declare function generateRefreshToken(payload: AuthPayload): string;
export declare function verifyToken(token: string): AuthPayload;
//# sourceMappingURL=auth.d.ts.map