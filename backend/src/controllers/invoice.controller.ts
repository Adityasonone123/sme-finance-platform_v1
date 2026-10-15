import { Request, Response, NextFunction } from 'express';
import {
  createSupplierInvoice,
  getInvoicesForUser,
  getInvoiceByIdForUser,
  updateSupplierInvoice,
  deleteSupplierInvoice,
  approveBuyerInvoice,
  rejectBuyerInvoice,
  attachInvoiceDocument,
  InvoiceServiceError,
} from '../services/invoice.service.js';
import { ValidationError } from '../validators/company.validator.js';
import { ApiResponse, ApiErrorResponse } from '../types/index.js';

export const createInvoice = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    let documentUrl: string | undefined = undefined;
    if (req.file) {
      documentUrl = `/uploads/invoices/${req.file.filename}`;
    }

    const invoice = await createSupplierInvoice(req.user.companyId, req.body, documentUrl);
    res.status(201).json({
      success: true,
      data: { invoice },
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof InvoiceServiceError) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
      return;
    }
    console.error('Create Invoice Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create invoice' });
  }
};

export const getInvoices = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const statusFilter = typeof req.query.status === 'string' ? req.query.status : undefined;
    const invoices = await getInvoicesForUser(req.user.companyId, req.user.role, statusFilter);

    res.status(200).json({
      success: true,
      data: { invoices },
    });
  } catch (error) {
    if (error instanceof InvoiceServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    console.error('Get Invoices Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve invoices' });
  }
};

export const getInvoiceById = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const invoiceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const invoice = await getInvoiceByIdForUser(req.user.companyId, req.user.role, invoiceId);

    res.status(200).json({
      success: true,
      data: { invoice },
    });
  } catch (error) {
    if (error instanceof InvoiceServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    console.error('Get Invoice By ID Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve invoice details' });
  }
};

export const updateInvoice = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const invoiceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const invoice = await updateSupplierInvoice(req.user.companyId, invoiceId, req.body);

    res.status(200).json({
      success: true,
      data: { invoice },
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof InvoiceServiceError) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
      return;
    }
    console.error('Update Invoice Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update invoice' });
  }
};

export const deleteInvoice = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const invoiceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteSupplierInvoice(req.user.companyId, invoiceId);

    res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully',
    });
  } catch (error) {
    if (error instanceof InvoiceServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    console.error('Delete Invoice Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete invoice' });
  }
};

export const approveInvoice = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const invoiceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const invoice = await approveBuyerInvoice(req.user.companyId, invoiceId);

    res.status(200).json({
      success: true,
      data: { invoice },
    });
  } catch (error) {
    if (error instanceof InvoiceServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    console.error('Approve Invoice Error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve invoice' });
  }
};

export const rejectInvoice = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const invoiceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const invoice = await rejectBuyerInvoice(req.user.companyId, invoiceId);

    res.status(200).json({
      success: true,
      data: { invoice },
    });
  } catch (error) {
    if (error instanceof InvoiceServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    console.error('Reject Invoice Error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject invoice' });
  }
};

export const uploadDocument = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    const invoiceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const documentUrl = `/uploads/invoices/${req.file.filename}`;
    const invoice = await attachInvoiceDocument(req.user.companyId, invoiceId, documentUrl);

    res.status(200).json({
      success: true,
      data: { invoice },
    });
  } catch (error) {
    if (error instanceof InvoiceServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    console.error('Upload Document Error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload document' });
  }
};
