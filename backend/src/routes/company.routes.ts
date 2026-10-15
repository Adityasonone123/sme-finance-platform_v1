import { Router } from 'express';
import { createCompany, getCompany, updateCompany } from '../controllers/company.controller.js';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateToken);

// GET /api/company is accessible to any authenticated user role to view their company profile
router.get('/', requireRoles(Role.SUPPLIER, Role.BUYER, Role.FINANCIAL_INSTITUTION, Role.ADMIN), getCompany);

// POST and PUT /api/company are restricted to company creators/updates
router.post('/', requireRoles(Role.SUPPLIER, Role.BUYER, Role.FINANCIAL_INSTITUTION), createCompany);
router.put('/', requireRoles(Role.SUPPLIER, Role.BUYER, Role.FINANCIAL_INSTITUTION), updateCompany);

export default router;
