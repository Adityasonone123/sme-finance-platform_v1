import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { verifyToken } from '../utils/jwt.js';
import { getCurrentUser } from '../services/auth.service.js';
import { config } from '../config/index.js';
import { ApiErrorResponse } from '../types/index.js';

export const authenticateToken = async (
  req: Request,
  res: Response<ApiErrorResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    let token = req.cookies?.[config.cookieName];

    // Fallback to Bearer token header if cookie not present
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in.',
      });
      return;
    }

    const payload = verifyToken(token);
    const user = await getCurrentUser(payload.sub);

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token',
    });
  }
};

export const requireRoles = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response<ApiErrorResponse>, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied: Insufficient permissions for this action',
      });
      return;
    }

    next();
  };
};
