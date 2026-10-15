import { Router } from 'express';
import {
  getFinancierOffersController,
  getOfferByIdController,
  createOfferController,
  acceptOfferController,
} from '../controllers/offers.controller.js';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateToken);

// List and view offers
router.get('/', requireRoles(Role.FINANCIAL_INSTITUTION, Role.SUPPLIER, Role.ADMIN), getFinancierOffersController);
router.get('/:id', requireRoles(Role.FINANCIAL_INSTITUTION, Role.SUPPLIER, Role.ADMIN), getOfferByIdController);

// Submit offer (Financier / Admin)
router.post('/', requireRoles(Role.FINANCIAL_INSTITUTION, Role.ADMIN), createOfferController);

// Accept offer (Supplier / Admin)
router.post('/:id/accept', requireRoles(Role.SUPPLIER, Role.ADMIN), acceptOfferController);

export default router;
