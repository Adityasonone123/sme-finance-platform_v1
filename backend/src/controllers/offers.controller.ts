import { Request, Response, NextFunction } from 'express';
import {
  getFinancierOffers,
  getOfferById,
  createFinancingOfferService,
  acceptFinancingOfferService,
} from '../services/offers.service.js';
import { ApiResponse, ApiErrorResponse } from '../types/index.js';

export const getFinancierOffersController = async (
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

    const result = await getFinancierOffers(req.user.role, req.user.companyId, filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Get Financier Offers Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve financing offers',
    });
  }
};

export const getOfferByIdController = async (
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
    const offer = await getOfferById(req.user.role, req.user.companyId, id);

    res.status(200).json({
      success: true,
      data: { offer },
    });
  } catch (error: any) {
    console.error('Get Offer By ID Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Financing offer not found',
    });
  }
};

export const createOfferController = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const offer = await createFinancingOfferService(req.user, req.body);

    res.status(201).json({
      success: true,
      message: 'Financing offer submitted successfully',
      data: { offer },
    });
  } catch (error: any) {
    console.error('Create Financing Offer Error:', error);
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Failed to submit financing offer',
    });
  }
};

export const acceptOfferController = async (
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
    const offer = await acceptFinancingOfferService(req.user, id);

    res.status(200).json({
      success: true,
      message: 'Financing offer ACCEPTED successfully',
      data: { offer },
    });
  } catch (error: any) {
    console.error('Accept Financing Offer Error:', error);
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Failed to accept financing offer',
    });
  }
};
