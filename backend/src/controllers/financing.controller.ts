import { Request, Response, NextFunction } from 'express';
import {
  createFinancingRequest,
  getSupplierFinancingRequests,
  getLenderFinancingRequests,
  getFinancingRequestById,
  approveFinancingRequest,
  rejectFinancingRequest,
  disburseFinancingRequest,
  repayFinancingRequest,
  FinancingServiceError,
} from '../services/financing.service.js';
import { checkInvoiceEligibility, FinancingEligibilityError } from '../services/financing-eligibility.service.js';
import { ValidationError } from '../validators/company.validator.js';
import { ApiResponse, ApiErrorResponse } from '../types/index.js';
import { Role } from '@prisma/client';

export const createRequest = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const request = await createFinancingRequest(req.user.companyId, req.body);
    res.status(201).json({
      success: true,
      data: { request },
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof FinancingServiceError || error instanceof FinancingEligibilityError) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
      return;
    }
    console.error('Create Financing Request Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create financing request' });
  }
};

export const getRequests = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const requests =
      req.user.role === Role.FINANCIAL_INSTITUTION || req.user.role === Role.ADMIN
        ? await getLenderFinancingRequests()
        : await getSupplierFinancingRequests(req.user.companyId);

    res.status(200).json({
      success: true,
      data: { requests },
    });
  } catch (error) {
    console.error('Get Financing Requests Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve financing requests' });
  }
};

export const getRequestById = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const requestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const request = await getFinancingRequestById(req.user.companyId, req.user.role, requestId);

    res.status(200).json({
      success: true,
      data: { request },
    });
  } catch (error) {
    if (error instanceof FinancingServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    console.error('Get Financing Request By ID Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve financing request' });
  }
};

export const approveRequest = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const requestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const request = await approveFinancingRequest(requestId, req.body.approvedAmount);

    res.status(200).json({
      success: true,
      data: { request },
    });
  } catch (error) {
    if (error instanceof FinancingServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    console.error('Approve Financing Request Error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve financing request' });
  }
};

export const rejectRequest = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const requestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const request = await rejectFinancingRequest(requestId);

    res.status(200).json({
      success: true,
      data: { request },
    });
  } catch (error) {
    if (error instanceof FinancingServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    console.error('Reject Financing Request Error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject financing request' });
  }
};

export const disburseRequest = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const requestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const request = await disburseFinancingRequest(requestId);

    res.status(200).json({
      success: true,
      data: { request },
    });
  } catch (error) {
    if (error instanceof FinancingServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    console.error('Disburse Financing Request Error:', error);
    res.status(500).json({ success: false, message: 'Failed to disburse financing' });
  }
};

export const repayRequest = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const requestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const request = await repayFinancingRequest(requestId);

    res.status(200).json({
      success: true,
      data: { request },
    });
  } catch (error) {
    if (error instanceof FinancingServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    console.error('Repay Financing Request Error:', error);
    res.status(500).json({ success: false, message: 'Failed to record financing repayment' });
  }
};

export const checkEligibility = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const invoiceId = Array.isArray(req.params.invoiceId) ? req.params.invoiceId[0] : req.params.invoiceId;
    const eligibility = await checkInvoiceEligibility(req.user.companyId, invoiceId);

    res.status(200).json({
      success: true,
      data: { eligibility },
    });
  } catch (error) {
    if (error instanceof FinancingEligibilityError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    console.error('Check Invoice Eligibility Error:', error);
    res.status(500).json({ success: false, message: 'Failed to evaluate invoice financing eligibility' });
  }
};
