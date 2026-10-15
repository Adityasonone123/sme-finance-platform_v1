import { Router } from 'express';
import {
  getBuyerSupplierRequestsController,
  respondToSupplierRequestController,
  getConnectedSuppliersForBuyerController,
} from '../controllers/buyer-relationship.controller.js';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateToken);
router.use(requireRoles(Role.BUYER));

router.get('/supplier-requests', getBuyerSupplierRequestsController);
router.post('/supplier-requests/:id/accept', (req, res, next) =>
  respondToSupplierRequestController(req, res, next, 'ACCEPT')
);
router.post('/supplier-requests/:id/reject', (req, res, next) =>
  respondToSupplierRequestController(req, res, next, 'REJECT')
);
router.get('/suppliers', getConnectedSuppliersForBuyerController);

export default router;
