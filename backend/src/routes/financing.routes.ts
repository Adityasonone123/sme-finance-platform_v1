import { Router } from 'express';
import {
  createRequest,
  getRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
  disburseRequest,
  repayRequest,
  checkEligibility,
} from '../controllers/financing.controller.js';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateToken);

// Supplier-only endpoints
router.post('/requests', requireRoles(Role.SUPPLIER), createRequest);
router.get('/eligibility/:invoiceId', requireRoles(Role.SUPPLIER), checkEligibility);

// Shared endpoints for Supplier, Financial Institution, and Admin
router.get('/requests', requireRoles(Role.SUPPLIER, Role.FINANCIAL_INSTITUTION, Role.ADMIN), getRequests);
router.get('/requests/:id', requireRoles(Role.SUPPLIER, Role.FINANCIAL_INSTITUTION, Role.ADMIN), getRequestById);

// Lender-only Underwriting & Lifecycle operations
router.post('/requests/:id/approve', requireRoles(Role.FINANCIAL_INSTITUTION, Role.ADMIN), approveRequest);
router.post('/requests/:id/reject', requireRoles(Role.FINANCIAL_INSTITUTION, Role.ADMIN), rejectRequest);
router.post('/requests/:id/disburse', requireRoles(Role.FINANCIAL_INSTITUTION, Role.ADMIN), disburseRequest);
router.post('/requests/:id/repay', requireRoles(Role.FINANCIAL_INSTITUTION, Role.ADMIN), repayRequest);

export default router;
