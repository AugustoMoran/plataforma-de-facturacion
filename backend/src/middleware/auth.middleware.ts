import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { config } from '../config/env';
import { RefreshToken } from '../database/models/refresh-token.model';
import { User } from '../database/models/user.model';
import type { AuthTokenPayload } from '../shared/types';
import { AppError } from './error.middleware';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthTokenPayload & { _id: string };
    }
  }
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const token =
      req.cookies?.['accessToken'] ??
      (req.headers['authorization']?.startsWith('Bearer ')
        ? req.headers['authorization'].slice(7)
        : undefined);

    if (!token) {
      return next(new AppError('Authentication required', 401));
    }

    const payload = jwt.verify(token, config.jwt.accessSecret) as AuthTokenPayload;

    // Attach user to request
    req.user = { ...payload, _id: payload.userId };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new AppError('Access token expired', 401));
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid access token', 401));
    }
    next(err);
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient role permissions', 403));
    }
    next();
  };
};

export const requirePermission = (permission: string) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401));
      }

      // Fetch fresh permissions from DB for real-time enforcement
      const user = await User.findById(req.user.userId).populate('roleId').lean();
      if (!user || !user.isActive || user.isDeleted) {
        return next(new AppError('User not found or inactive', 401));
      }

      const mergedPermissions = {
        ...(user.roleId as any)?.permissions,
        ...user.permissions,
      };

      if (!mergedPermissions[permission]) {
        return next(new AppError(`Permission denied: ${permission}`, 403));
      }

      // Update token payload with fresh permissions
      req.user = {
        ...req.user,
        permissions: mergedPermissions,
      };

      next();
    } catch (err) {
      next(err);
    }
  };
};

export const optionalAuthenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies?.['accessToken'];
    if (token) {
      const payload = jwt.verify(token, config.jwt.accessSecret) as AuthTokenPayload;
      req.user = { ...payload, _id: payload.userId };
    }
    next();
  } catch {
    next();
  }
};
