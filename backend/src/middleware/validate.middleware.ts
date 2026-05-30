import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';

import { AppError } from './error.middleware';

export const validate = (req: Request, _res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((e) => ({
      field: e.type === 'field' ? e.path : e.type,
      message: e.msg as string,
    }));
    return next(
      Object.assign(new AppError('Validation failed', 422), { errors: errorMessages }),
    );
  }
  next();
};
