import { Router } from 'express';
import {
  getUnderwritingQueueController,
  getUnderwritingDetailsController,
  approveUnderwritingController,
  rejectUnderwritingController,
} from '../controllers/underwriting.controller.js';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateToken);
router.use(requireRoles(Role.FINANCIAL_INSTITUTION, Role.ADMIN));

router.get('/queue', getUnderwritingQueueController);
router.get('/:id', getUnderwritingDetailsController);
router.post('/:id/approve', approveUnderwritingController);
router.post('/:id/reject', rejectUnderwritingController);

export default router;
