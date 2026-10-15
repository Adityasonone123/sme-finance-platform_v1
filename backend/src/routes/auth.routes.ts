import { Router } from 'express';
import { Role } from '@prisma/client';
import { register, login, me, logout, testSupplier, testAdmin } from '../controllers/auth.controller.js';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Public Authentication Endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected User Profile Endpoint
router.get('/me', authenticateToken, me);

// Development Role Verification Endpoints
router.get('/test-supplier', authenticateToken, requireRoles(Role.SUPPLIER), testSupplier);
router.get('/test-admin', authenticateToken, requireRoles(Role.ADMIN), testAdmin);

export default router;
