import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { AppError } from './error.middleware';
import { config } from '../config/env';

const CSRF_COOKIE = 'csrf-token';
const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF protection using the Double Submit Cookie pattern.
 *
 * How it works:
 * 1. On first request (or when cookie is missing), generate a random token
 *    and set it as a non-HttpOnly cookie (so JS can read it).
 * 2. On state-changing requests (POST/PUT/PATCH/DELETE), require the same
 *    token to be sent back in the X-CSRF-Token header.
 * 3. Compare cookie value vs header value — if they match, the request
 *    originated from our SPA (cross-site attackers cannot read the cookie
 *    due to SameSite=Strict + cross-origin restrictions).
 *
 * This works in combination with SameSite=Strict on the auth cookies.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // In test environment, skip validation but still register the middleware
  if (config.env === 'test') {
    return next();
  }

  // Skip CSRF check for safe HTTP methods
  if (SAFE_METHODS.has(req.method)) {
    ensureCsrfCookie(req, res);
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE] as string | undefined;
  const headerToken = req.headers[CSRF_HEADER] as string | undefined;

  if (!cookieToken || !headerToken) {
    return next(new AppError('CSRF token missing', 403));
  }

  // Constant-time comparison to prevent timing attacks
  const cookieBuf = Buffer.from(cookieToken, 'hex');
  const headerBuf = Buffer.from(headerToken, 'hex');

  if (
    cookieBuf.length !== headerBuf.length ||
    !crypto.timingSafeEqual(cookieBuf, headerBuf)
  ) {
    return next(new AppError('Invalid CSRF token', 403));
  }

  // Rotate the token after use (optional but recommended)
  ensureCsrfCookie(req, res, true);
  next();
}

/**
 * Sets the CSRF cookie if it is not already present (or forces rotation).
 */
function ensureCsrfCookie(req: Request, res: Response, rotate = false): void {
  if (!req.cookies?.[CSRF_COOKIE] || rotate) {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE, token, {
      // NOT HttpOnly — the SPA must read this to include it in the header
      httpOnly: false,
      secure: config.env === 'production',
      sameSite: 'strict',
      // Scoped to the API path
      path: '/',
    });
  }
}

/**
 * Endpoint that returns a fresh CSRF token (SPA calls this on startup).
 */
export function getCsrfToken(req: Request, res: Response): void {
  ensureCsrfCookie(req, res, true);
  const token = req.cookies?.[CSRF_COOKIE] as string;
  res.json({ csrfToken: token });
}
