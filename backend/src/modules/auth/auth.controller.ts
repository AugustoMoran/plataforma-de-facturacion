import { NextFunction, Request, Response } from 'express';

import { config } from '../../config/env';
import { authService } from './auth.service';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.env === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body as { email: string; password: string };
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      const { tokenPair, user } = await authService.login({ email, password }, ipAddress, userAgent);

      res.cookie('accessToken', tokenPair.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000, // 15 min
      });

      res.cookie('refreshToken', tokenPair.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/api/auth/refresh',
      });

      res.status(200).json({
        success: true,
        data: { user },
        message: 'Login successful',
      });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefreshToken = req.cookies?.['refreshToken'];
      if (!rawRefreshToken) {
        res.status(401).json({ success: false, message: 'Refresh token required' });
        return;
      }

      const tokenPair = await authService.refreshTokens(
        rawRefreshToken,
        req.ip,
        req.headers['user-agent'],
      );

      res.cookie('accessToken', tokenPair.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refreshToken', tokenPair.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/auth/refresh',
      });

      res.status(200).json({ success: true, message: 'Tokens refreshed' });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefreshToken = req.cookies?.['refreshToken'];
      await authService.logout(rawRefreshToken);

      res.clearCookie('accessToken', COOKIE_OPTIONS);
      res.clearCookie('refreshToken', { ...COOKIE_OPTIONS, path: '/api/auth/refresh' });

      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({ success: true, data: req.user });
    } catch (err) {
      next(err);
    }
  }

  async logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
      }
      await authService.logoutAllDevices(req.user.userId);

      res.clearCookie('accessToken', COOKIE_OPTIONS);
      res.clearCookie('refreshToken', { ...COOKIE_OPTIONS, path: '/api/auth/refresh' });

      res.status(200).json({ success: true, message: 'Logged out from all devices' });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
