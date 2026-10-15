import { Request, Response, NextFunction } from 'express';
import {
  getRepaymentQueue,
  getRepaymentDetails,
  recordRepaymentService,
} from '../services/repayment.service.js';
import { ApiResponse, ApiErrorResponse } from '../types/index.js';

export const getRepaymentQueueController = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { q, status, minAmount, maxAmount, sortBy, sortOrder, page, limit } = req.query;

    const filters = {
      q: typeof q === 'string' ? q : undefined,
      status: typeof status === 'string' ? status : undefined,
      minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount as string) : undefined,
      sortBy: typeof sortBy === 'string' ? sortBy : undefined,
      sortOrder: sortOrder === 'asc' || sortOrder === 'desc' ? (sortOrder as 'asc' | 'desc') : undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
    };

    const result = await getRepaymentQueue(req.user.role, req.user.companyId, filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Get Repayment Queue Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve repayment queue',
    });
  }
};

export const getRepaymentDetailsController = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await getRepaymentDetails(req.user.role, id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Get Repayment Details Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Financing transaction not found',
    });
  }
};

export const recordRepaymentController = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { amount, notes } = req.body;

    const result = await recordRepaymentService(req.user, id, parseFloat(amount), notes);

    res.status(200).json({
      success: true,
      message: 'Simulated financing repayment RECORDED & SETTLED successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Record Repayment Error:', error);
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Failed to record repayment',
    });
  }
};
