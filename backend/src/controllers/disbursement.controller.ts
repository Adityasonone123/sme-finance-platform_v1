import { Request, Response, NextFunction } from 'express';
import {
  getDisbursementQueue,
  getDisbursementDetails,
  executeDisbursementService,
} from '../services/disbursement.service.js';
import { ApiResponse, ApiErrorResponse } from '../types/index.js';

export const getDisbursementQueueController = async (
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

    const result = await getDisbursementQueue(req.user.role, req.user.companyId, filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Get Disbursement Queue Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve disbursement queue',
    });
  }
};

export const getDisbursementDetailsController = async (
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
    const result = await getDisbursementDetails(req.user.role, id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Get Disbursement Details Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Disbursement transaction not found',
    });
  }
};

export const executeDisbursementController = async (
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
    const { notes } = req.body;

    const result = await executeDisbursementService(req.user, id, notes);

    res.status(200).json({
      success: true,
      message: 'Simulated financing disbursement EXECUTED successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Execute Disbursement Error:', error);
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Failed to execute disbursement transaction',
    });
  }
};
