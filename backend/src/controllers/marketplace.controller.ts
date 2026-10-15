import { Request, Response, NextFunction } from 'express';
import {
  getMarketplaceOpportunities,
  getMarketplaceOpportunityById,
} from '../services/marketplace.service.js';
import { ApiResponse, ApiErrorResponse } from '../types/index.js';

export const getMarketplaceOpportunitiesController = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const {
      q,
      status,
      minAmount,
      maxAmount,
      maxTenor,
      minBuyerScore,
      sortBy,
      sortOrder,
      page,
      limit,
    } = req.query;

    const filters = {
      q: typeof q === 'string' ? q : undefined,
      status: typeof status === 'string' ? status : undefined,
      minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount as string) : undefined,
      maxTenor: maxTenor ? parseInt(maxTenor as string) : undefined,
      minBuyerScore: minBuyerScore ? parseInt(minBuyerScore as string) : undefined,
      sortBy: typeof sortBy === 'string' ? sortBy : undefined,
      sortOrder: sortOrder === 'asc' || sortOrder === 'desc' ? (sortOrder as 'asc' | 'desc') : undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
    };

    const result = await getMarketplaceOpportunities(req.user.role, req.user.companyId, filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Get Marketplace Opportunities Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve financing marketplace opportunities',
    });
  }
};

export const getMarketplaceOpportunityByIdController = async (
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
    const opportunity = await getMarketplaceOpportunityById(req.user.role, id);

    res.status(200).json({
      success: true,
      data: { opportunity },
    });
  } catch (error: any) {
    console.error('Get Marketplace Opportunity By ID Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Financing opportunity not found',
    });
  }
};
