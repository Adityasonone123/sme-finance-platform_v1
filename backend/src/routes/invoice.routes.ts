import { Router } from 'express';
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  approveInvoice,
  rejectInvoice,
  uploadDocument,
} from '../controllers/invoice.controller.js';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware.js';
import { uploadInvoiceDoc } from '../middleware/upload.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// All invoice routes require authentication
router.use(authenticateToken);

// List and Get Single Invoice (SUPPLIER & BUYER)
router.get('/', requireRoles(Role.SUPPLIER, Role.BUYER), getInvoices);
router.get('/:id', requireRoles(Role.SUPPLIER, Role.BUYER), getInvoiceById);

// Create, Update, Delete & Document Upload (SUPPLIER Only)
router.post('/', requireRoles(Role.SUPPLIER), uploadInvoiceDoc.single('document'), createInvoice);
router.put('/:id', requireRoles(Role.SUPPLIER), updateInvoice);
router.delete('/:id', requireRoles(Role.SUPPLIER), deleteInvoice);
router.post('/:id/upload', requireRoles(Role.SUPPLIER), uploadInvoiceDoc.single('document'), uploadDocument);

// Approve & Reject Invoice (BUYER Only)
router.post('/:id/approve', requireRoles(Role.BUYER), approveInvoice);
router.post('/:id/reject', requireRoles(Role.BUYER), rejectInvoice);

export default router;
