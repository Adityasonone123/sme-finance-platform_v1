import { Request, Response, NextFunction } from 'express';
import {
  recordPayment,
  getPaymentsForUser,
  getPaymentByIdForUser,
  PaymentServiceError,
} from '../services/payment.service.js';
import { ValidationError } from '../validators/company.validator.js';
import { ApiResponse, ApiErrorResponse } from '../types/index.js';

export const createPayment = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const payment = await recordPayment(req.user.companyId, req.user.role, req.body);
    res.status(201).json({
      success: true,
      data: { payment },
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof PaymentServiceError) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
      return;
    }
    console.error('Create Payment Error:', error);
    res.status(500).json({ success: false, message: 'Failed to record payment' });
  }
};

export const getPayments = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const payments = await getPaymentsForUser(req.user.companyId, req.user.role);
    res.status(200).json({
      success: true,
      data: { payments },
    });
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    console.error('Get Payments Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve payments' });
  }
};

export const getPaymentById = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const paymentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const payment = await getPaymentByIdForUser(req.user.companyId, req.user.role, paymentId);

    res.status(200).json({
      success: true,
      data: { payment },
    });
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    console.error('Get Payment By ID Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve payment details' });
  }
};
