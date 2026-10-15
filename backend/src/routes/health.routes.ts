import { Router } from 'express';
import { getHealthStatus, getRootStatus } from '../controllers/health.controller.js';

const router = Router();

router.get('/', getRootStatus);
router.get('/api/health', getHealthStatus);

export default router;
