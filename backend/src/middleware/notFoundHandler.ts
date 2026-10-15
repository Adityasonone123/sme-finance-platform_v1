import { Request, Response } from 'express';
import { ApiErrorResponse } from '../types/index.js';

export const notFoundHandler = (_req: Request, res: Response<ApiErrorResponse>): void => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
};
