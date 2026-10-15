import { Router } from 'express';
import {
  getPortfolioOverviewController,
  getPortfolioListController,
  getPortfolioDetailsController,
} from '../controllers/portfolio.controller.js';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateToken);
router.use(requireRoles(Role.FINANCIAL_INSTITUTION, Role.ADMIN));

router.get('/overview', getPortfolioOverviewController);
router.get('/list', getPortfolioListController);
router.get('/:id', getPortfolioDetailsController);

export default router;
