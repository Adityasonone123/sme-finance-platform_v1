import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  triggerOverdueScan,
} from '../controllers/notification.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// All notification routes require authentication
router.use(authenticateToken);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.post('/trigger-overdue-scan', triggerOverdueScan);

export default router;
