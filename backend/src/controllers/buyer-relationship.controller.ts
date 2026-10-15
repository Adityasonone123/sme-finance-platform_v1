import { Request, Response, NextFunction } from 'express';
import {
  getBuyerSupplierRequests,
  respondToSupplierRequest,
  getConnectedSuppliersForBuyer,
} from '../services/buyer.service.js';
import { CompanyServiceError } from '../services/company.service.js';
import { ApiResponse, ApiErrorResponse } from '../types/index.js';

export const getBuyerSupplierRequestsController = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const requests = await getBuyerSupplierRequests(req.user.companyId);
    res.status(200).json({
      success: true,
      data: { requests },
    });
  } catch (error) {
    if (error instanceof CompanyServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    console.error('Get Supplier Requests Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve supplier requests' });
  }
};

export const respondToSupplierRequestController = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction,
  action: 'ACCEPT' | 'REJECT'
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const requestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const relationship = await respondToSupplierRequest(req.user.companyId, requestId, action);

    res.status(200).json({
      success: true,
      data: { relationship },
      message: `Connection request ${action === 'ACCEPT' ? 'accepted' : 'declined'} successfully`,
    });
  } catch (error) {
    if (error instanceof CompanyServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    console.error('Respond Supplier Request Error:', error);
    res.status(500).json({ success: false, message: 'Failed to respond to supplier connection request' });
  }
};

export const getConnectedSuppliersForBuyerController = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const suppliers = await getConnectedSuppliersForBuyer(req.user.companyId);
    res.status(200).json({
      success: true,
      data: { suppliers },
    });
  } catch (error) {
    if (error instanceof CompanyServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    console.error('Get Connected Suppliers Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve connected suppliers' });
  }
};
