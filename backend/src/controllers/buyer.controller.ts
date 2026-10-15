import { Request, Response, NextFunction } from 'express';
import {
  searchRegisteredBuyers,
  sendConnectionRequest,
  inviteUnregisteredBuyer,
  getSupplierBuyersDetailed,
  getSupplierBuyers,
  getSupplierBuyerById,
  updateCorporateBuyer,
} from '../services/buyer.service.js';
import { CompanyServiceError } from '../services/company.service.js';
import { ValidationError } from '../validators/company.validator.js';
import { ApiResponse, ApiErrorResponse } from '../types/index.js';

export const searchBuyersController = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const query = typeof req.query.q === 'string' ? req.query.q : '';
    const results = await searchRegisteredBuyers(req.user.companyId, query);
    res.status(200).json({
      success: true,
      data: { buyers: results },
    });
  } catch (error) {
    if (error instanceof CompanyServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    console.error('Search Buyers Error:', error);
    res.status(500).json({ success: false, message: 'Failed to search registered buyers' });
  }
};

export const connectBuyerController = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { buyerCompanyId } = req.body;
    if (!buyerCompanyId) {
      res.status(400).json({ success: false, message: 'Buyer company ID is required' });
      return;
    }

    const relationship = await sendConnectionRequest(req.user.companyId, buyerCompanyId);
    res.status(201).json({
      success: true,
      data: { relationship },
      message: 'Connection request sent successfully',
    });
  } catch (error) {
    if (error instanceof CompanyServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    console.error('Connect Buyer Error:', error);
    res.status(500).json({ success: false, message: 'Failed to send connection request' });
  }
};

export const inviteBuyerController = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { companyName, contactEmail, contactName } = req.body;
    const invitation = await inviteUnregisteredBuyer(req.user.companyId, companyName, contactEmail, contactName);
    res.status(201).json({
      success: true,
      data: { invitation },
      message: 'Invitation created and sent successfully',
    });
  } catch (error) {
    if (error instanceof CompanyServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    console.error('Invite Buyer Error:', error);
    res.status(500).json({ success: false, message: 'Failed to send buyer invitation' });
  }
};

export const getSupplierBuyersController = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const detailed = await getSupplierBuyersDetailed(req.user.companyId);
    res.status(200).json({
      success: true,
      data: detailed,
    });
  } catch (error) {
    if (error instanceof CompanyServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    console.error('Get Buyers Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve corporate buyers' });
  }
};

export const getBuyerByIdController = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const buyerId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const buyer = await getSupplierBuyerById(req.user.companyId, buyerId);
    res.status(200).json({
      success: true,
      data: { buyer },
    });
  } catch (error) {
    if (error instanceof CompanyServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    console.error('Get Buyer By ID Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve buyer details' });
  }
};

export const updateBuyerController = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const buyerId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const buyer = await updateCorporateBuyer(req.user.companyId, buyerId, req.body);
    res.status(200).json({
      success: true,
      data: { buyer },
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof CompanyServiceError) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
      return;
    }
    console.error('Update Buyer Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update corporate buyer' });
  }
};
