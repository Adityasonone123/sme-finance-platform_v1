import { Request, Response, NextFunction } from 'express';
import {
  getPortfolioOverview,
  getPortfolioList,
  getPortfolioDetails,
} from '../services/portfolio.service.js';
import { ApiResponse, ApiErrorResponse } from '../types/index.js';

export const getPortfolioOverviewController = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { dateRange } = req.query;
    const result = await getPortfolioOverview(
      req.user.role,
      req.user.companyId,
      typeof dateRange === 'string' ? dateRange : undefined
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Get Portfolio Overview Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve portfolio overview',
    });
  }
};

export const getPortfolioListController = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { q, status, minAmount, maxAmount, sortBy, sortOrder, page, limit, dateRange } = req.query;

    const filters = {
      q: typeof q === 'string' ? q : undefined,
      status: typeof status === 'string' ? status : undefined,
      minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount as string) : undefined,
      sortBy: typeof sortBy === 'string' ? sortBy : undefined,
      sortOrder: sortOrder === 'asc' || sortOrder === 'desc' ? (sortOrder as 'asc' | 'desc') : undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      dateRange: typeof dateRange === 'string' ? dateRange : undefined,
    };

    const result = await getPortfolioList(req.user.role, req.user.companyId, filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Get Portfolio List Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve portfolio list',
    });
  }
};

export const getPortfolioDetailsController = async (
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
    const result = await getPortfolioDetails(req.user.role, id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Get Portfolio Details Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Portfolio financing transaction not found',
    });
  }
};
