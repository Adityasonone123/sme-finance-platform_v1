import { Request, Response, NextFunction } from 'express';
import {
  calculateBuyerPaymentScore,
  getSupplierBuyerScores,
  BuyerScoreServiceError,
} from '../services/buyer-score.service.js';
import { ApiResponse, ApiErrorResponse } from '../types/index.js';

export const getSingleBuyerScore = async (
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
    const score = await calculateBuyerPaymentScore(req.user.companyId, buyerId);

    res.status(200).json({
      success: true,
      data: { score },
    });
  } catch (error) {
    if (error instanceof BuyerScoreServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    console.error('Get Single Buyer Score Error:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate buyer payment score' });
  }
};

export const getAllBuyerScores = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const scores = await getSupplierBuyerScores(req.user.companyId);

    res.status(200).json({
      success: true,
      data: { scores },
    });
  } catch (error) {
    console.error('Get All Buyer Scores Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve buyer payment scores' });
  }
};
