import { Router } from 'express';
import {
  getMarketplaceOpportunitiesController,
  getMarketplaceOpportunityByIdController,
} from '../controllers/marketplace.controller.js';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateToken);
router.use(requireRoles(Role.FINANCIAL_INSTITUTION, Role.ADMIN));

router.get('/', getMarketplaceOpportunitiesController);
router.get('/:id', getMarketplaceOpportunityByIdController);

export default router;
