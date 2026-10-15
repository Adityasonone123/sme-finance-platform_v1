import { Request, Response, NextFunction } from 'express';
import {
  getSupplierDashboardData,
  getBuyerDashboardData,
  getLenderDashboardData,
  getAdminDashboardData,
} from '../services/dashboard.service.js';
import { ApiResponse, ApiErrorResponse } from '../types/index.js';

export const getSupplierDashboard = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const summary = await getSupplierDashboardData(req.user.companyId);
    res.status(200).json({
      success: true,
      data: { dashboard: summary },
    });
  } catch (error) {
    console.error('Get Supplier Dashboard Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve supplier dashboard metrics' });
  }
};

export const getBuyerDashboard = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const summary = await getBuyerDashboardData(req.user.companyId);
    res.status(200).json({
      success: true,
      data: { dashboard: summary },
    });
  } catch (error) {
    console.error('Get Buyer Dashboard Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve buyer dashboard metrics' });
  }
};

export const getLenderDashboard = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const summary = await getLenderDashboardData(req.user.companyId);
    res.status(200).json({
      success: true,
      data: { dashboard: summary },
    });
  } catch (error) {
    console.error('Get Lender Dashboard Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve lender dashboard metrics' });
  }
};

export const getAdminDashboard = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const summary = await getAdminDashboardData();
    res.status(200).json({
      success: true,
      data: { dashboard: summary },
    });
  } catch (error) {
    console.error('Get Admin Dashboard Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve admin dashboard metrics' });
  }
};
