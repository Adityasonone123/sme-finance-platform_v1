import { Router } from 'express';
import { createPayment, getPayments, getPaymentById } from '../controllers/payment.controller.js';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// All payment routes require authentication and SUPPLIER or BUYER role
router.use(authenticateToken);
router.use(requireRoles(Role.SUPPLIER, Role.BUYER));

router.post('/', createPayment);
router.get('/', getPayments);
router.get('/:id', getPaymentById);

export default router;
