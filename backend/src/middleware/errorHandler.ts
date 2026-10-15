import { Request, Response, NextFunction } from 'express';
import { ApiErrorResponse } from '../types/index.js';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response<ApiErrorResponse>,
  _next: NextFunction
): void => {
  console.error('Unhandled Error:', err.message || err);
  res.status(500).json({
    success: false,
    message: 'Something went wrong',
  });
};
