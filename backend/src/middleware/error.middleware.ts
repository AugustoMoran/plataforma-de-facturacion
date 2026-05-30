import { NextFunction, Request, Response } from 'express';

import { logger } from '../config/logger';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(`[${req.method}] ${req.path}`, {
        message: err.message,
        stack: err.stack,
        statusCode: err.statusCode,
      });
    }

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    res.status(422).json({
      success: false,
      message: 'Validation error',
      errors: Object.values((err as any).errors).map((e: any) => ({
        field: e.path,
        message: e.message,
      })),
    });
    return;
  }

  // Mongoose duplicate key
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyPattern ?? {})[0] ?? 'field';
    res.status(409).json({
      success: false,
      message: `Duplicate value for ${field}`,
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
    return;
  }

  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};
