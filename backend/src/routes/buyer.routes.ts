import { Router } from 'express';
import {
  searchBuyersController,
  connectBuyerController,
  inviteBuyerController,
  getSupplierBuyersController,
  getBuyerByIdController,
  updateBuyerController,
} from '../controllers/buyer.controller.js';
import { getSingleBuyerScore, getAllBuyerScores } from '../controllers/buyer-score.controller.js';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// All buyer management routes require authentication and SUPPLIER role
router.use(authenticateToken);
router.use(requireRoles(Role.SUPPLIER));

router.get('/search', searchBuyersController);
router.post('/connect', connectBuyerController);
router.post('/invite', inviteBuyerController);

router.get('/', getSupplierBuyersController);

// Scores routes (must be defined before /:id)
router.get('/scores', getAllBuyerScores);
router.get('/:id/score', getSingleBuyerScore);

router.get('/:id', getBuyerByIdController);
router.put('/:id', updateBuyerController);

export default router;
