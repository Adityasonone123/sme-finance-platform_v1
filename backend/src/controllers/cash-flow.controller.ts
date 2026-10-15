import { Request, Response, NextFunction } from 'express';
import {
  createCashFlowEntry,
  getCashFlowEntriesForUser,
  getCashFlowEntryByIdForUser,
  updateCashFlowEntry,
  deleteCashFlowEntry,
  getCashFlowSummary,
  getCashFlowForecast,
  CashFlowServiceError,
} from '../services/cash-flow.service.js';
import { ValidationError } from '../validators/company.validator.js';
import { ApiResponse, ApiErrorResponse } from '../types/index.js';

export const createEntry = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const entry = await createCashFlowEntry(req.user.companyId, req.body);
    res.status(201).json({
      success: true,
      data: { entry },
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof CashFlowServiceError) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
      return;
    }
    console.error('Create Cash Flow Entry Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create cash flow entry' });
  }
};

export const getEntries = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const entries = await getCashFlowEntriesForUser(req.user.companyId);
    res.status(200).json({
      success: true,
      data: { entries },
    });
  } catch (error) {
    console.error('Get Cash Flow Entries Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve cash flow entries' });
  }
};

export const getEntryById = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const entryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const entry = await getCashFlowEntryByIdForUser(req.user.companyId, entryId);

    res.status(200).json({
      success: true,
      data: { entry },
    });
  } catch (error) {
    if (error instanceof CashFlowServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    console.error('Get Cash Flow Entry By ID Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve cash flow entry' });
  }
};

export const updateEntry = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const entryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const entry = await updateCashFlowEntry(req.user.companyId, entryId, req.body);

    res.status(200).json({
      success: true,
      data: { entry },
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof CashFlowServiceError) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
      return;
    }
    console.error('Update Cash Flow Entry Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update cash flow entry' });
  }
};

export const deleteEntry = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const entryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteCashFlowEntry(req.user.companyId, entryId);

    res.status(200).json({
      success: true,
      message: 'Cash flow entry deleted successfully',
    });
  } catch (error) {
    if (error instanceof CashFlowServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    console.error('Delete Cash Flow Entry Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete cash flow entry' });
  }
};

export const getSummary = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const summary = await getCashFlowSummary(req.user.companyId);
    res.status(200).json({
      success: true,
      data: { summary },
    });
  } catch (error) {
    console.error('Get Cash Flow Summary Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve cash flow summary' });
  }
};

export const getForecast = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const horizonParam = req.query.horizon ? parseInt(req.query.horizon as string, 10) : 30;
    const horizonDays = [7, 30, 60, 90].includes(horizonParam) ? horizonParam : 30;

    const forecast = await getCashFlowForecast(req.user.companyId, horizonDays);
    res.status(200).json({
      success: true,
      data: { forecast },
    });
  } catch (error) {
    console.error('Get Cash Flow Forecast Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve cash flow forecast' });
  }
};

export const getWorkingCapitalGap = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const horizonParam = req.query.horizon ? parseInt(req.query.horizon as string, 10) : 30;
    const horizonDays = [7, 30, 60, 90].includes(horizonParam) ? horizonParam : 30;

    const forecast = await getCashFlowForecast(req.user.companyId, horizonDays);
    res.status(200).json({
      success: true,
      data: {
        projectedCash: forecast.projectedCash,
        workingCapitalGap: forecast.workingCapitalGap,
        status: forecast.status,
      },
    });
  } catch (error) {
    console.error('Get Working Capital Gap Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve working capital gap' });
  }
};
