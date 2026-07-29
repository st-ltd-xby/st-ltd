import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { unauthorized } from '../common/response';

const JWT_SECRET = process.env.JWT_SECRET || 'ltd-hub-jwt-secret-key-2026';

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

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(res);
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return unauthorized(res, 'Token 已过期，请重新登录');
  }
}

// 授权角色中间件
export function authorizeRole(allowedRoles: string[]) {
  return function (req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
      return unauthorized(res, '未授权访问');
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return unauthorized(res, '权限不足');
    }
    
    next();
  };
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
      req.user = decoded;
    } catch {}
  }
  next();
}

export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
}

export function generateRefreshToken(payload: AuthPayload): string {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'ltd-hub-refresh', {
    expiresIn: '30d',
  } as jwt.SignOptions);
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
}
