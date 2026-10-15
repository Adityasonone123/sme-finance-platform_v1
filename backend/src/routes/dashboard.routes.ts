import { Router } from 'express';
import {
  getSupplierDashboard,
  getBuyerDashboard,
  getLenderDashboard,
  getAdminDashboard,
} from '../controllers/dashboard.controller.js';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateToken);

router.get('/supplier', requireRoles(Role.SUPPLIER), getSupplierDashboard);
router.get('/buyer', requireRoles(Role.BUYER), getBuyerDashboard);
router.get('/financial-institution', requireRoles(Role.FINANCIAL_INSTITUTION, Role.ADMIN), getLenderDashboard);
router.get('/admin', requireRoles(Role.ADMIN), getAdminDashboard);

export default router;
