import { Request, Response, NextFunction } from 'express';
import {
  createSupplierCompany,
  getSupplierCompany,
  updateSupplierCompany,
  CompanyServiceError,
} from '../services/company.service.js';
import { ValidationError } from '../validators/company.validator.js';
import { ApiResponse, ApiErrorResponse } from '../types/index.js';

export const createCompany = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const company = await createSupplierCompany(req.user.id, req.body);
    res.status(201).json({
      success: true,
      data: { company },
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof CompanyServiceError) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
      return;
    }
    console.error('Create Company Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create company profile' });
  }
};

export const getCompany = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const company = await getSupplierCompany(req.user.companyId);
    res.status(200).json({
      success: true,
      data: { company },
    });
  } catch (error) {
    if (error instanceof CompanyServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    console.error('Get Company Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve company profile' });
  }
};

export const updateCompany = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const company = await updateSupplierCompany(req.user.companyId, req.body);
    res.status(200).json({
      success: true,
      data: { company },
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof CompanyServiceError) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
      return;
    }
    console.error('Update Company Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update company profile' });
  }
};
