import { Request, Response, NextFunction } from 'express';
import {
  getUnderwritingQueue,
  getUnderwritingDetails,
  processUnderwritingApproval,
  processUnderwritingRejection,
} from '../services/underwriting.service.js';
import { ApiResponse, ApiErrorResponse } from '../types/index.js';

export const getUnderwritingQueueController = async (
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

    const result = await getUnderwritingQueue(req.user.role, req.user.companyId, filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Get Underwriting Queue Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve underwriting queue',
    });
  }
};

export const getUnderwritingDetailsController = async (
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
    const result = await getUnderwritingDetails(req.user.role, id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Get Underwriting Details Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Underwriting opportunity not found',
    });
  }
};

export const approveUnderwritingController = async (
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
    const { approvedAmount, notes } = req.body;

    const result = await processUnderwritingApproval(req.user, id, approvedAmount, notes);

    res.status(200).json({
      success: true,
      message: 'Financing request underwriting APPROVED successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Approve Underwriting Error:', error);
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Failed to record underwriting approval',
    });
  }
};

export const rejectUnderwritingController = async (
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
    const { rejectionReason, notes } = req.body;

    if (!rejectionReason || !rejectionReason.trim()) {
      res.status(422).json({
        success: false,
        message: 'Rejection reason is mandatory when declining an underwriting application',
      });
      return;
    }

    const result = await processUnderwritingRejection(req.user, id, rejectionReason, notes);

    res.status(200).json({
      success: true,
      message: 'Financing request underwriting REJECTED successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Reject Underwriting Error:', error);
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Failed to record underwriting rejection',
    });
  }
};
