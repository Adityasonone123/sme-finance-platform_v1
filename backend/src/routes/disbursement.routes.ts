import { Router } from 'express';
import {
  getDisbursementQueueController,
  getDisbursementDetailsController,
  executeDisbursementController,
} from '../controllers/disbursement.controller.js';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateToken);
router.use(requireRoles(Role.FINANCIAL_INSTITUTION, Role.ADMIN));

router.get('/queue', getDisbursementQueueController);
router.get('/:id', getDisbursementDetailsController);
router.post('/:id/execute', executeDisbursementController);

export default router;
