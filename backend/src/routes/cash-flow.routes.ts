import { Router } from 'express';
import {
  createEntry,
  getEntries,
  getEntryById,
  updateEntry,
  deleteEntry,
  getSummary,
  getForecast,
  getWorkingCapitalGap,
} from '../controllers/cash-flow.controller.js';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// All cash flow routes require authentication and SUPPLIER role
router.use(authenticateToken);
router.use(requireRoles(Role.SUPPLIER));

router.post('/entries', createEntry);
router.get('/entries', getEntries);
router.get('/entries/:id', getEntryById);
router.put('/entries/:id', updateEntry);
router.delete('/entries/:id', deleteEntry);

router.get('/summary', getSummary);
router.get('/forecast', getForecast);
router.get('/working-capital-gap', getWorkingCapitalGap);

export default router;
