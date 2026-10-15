import { Router } from 'express';
import {
  getRepaymentQueueController,
  getRepaymentDetailsController,
  recordRepaymentController,
} from '../controllers/repayment.controller.js';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateToken);
router.use(requireRoles(Role.FINANCIAL_INSTITUTION, Role.ADMIN));

router.get('/queue', getRepaymentQueueController);
router.get('/:id', getRepaymentDetailsController);
router.post('/:id/record', recordRepaymentController);

export default router;
