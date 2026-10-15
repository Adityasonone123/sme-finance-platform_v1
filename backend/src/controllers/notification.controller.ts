import { Request, Response, NextFunction } from 'express';
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  NotificationServiceError,
} from '../services/notification.service.js';
import { scanAndUpdateOverdueInvoices } from '../services/overdue.service.js';
import { ApiResponse, ApiErrorResponse } from '../types/index.js';

export const getNotifications = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const notifications = await getUserNotifications(req.user.id);
    res.status(200).json({
      success: true,
      data: { notifications },
    });
  } catch (error) {
    console.error('Get Notifications Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve notifications' });
  }
};

export const getUnreadCount = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const count = await getUnreadNotificationCount(req.user.id);
    res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('Get Unread Count Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve unread notification count' });
  }
};

export const markAsRead = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const notificationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const notification = await markNotificationAsRead(req.user.id, notificationId);

    res.status(200).json({
      success: true,
      data: { notification },
    });
  } catch (error) {
    if (error instanceof NotificationServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    console.error('Mark Notification As Read Error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
};

export const markAllAsRead = async (
  req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const count = await markAllNotificationsAsRead(req.user.id);
    res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('Mark All Notifications As Read Error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark all notifications as read' });
  }
};

export const triggerOverdueScan = async (
  _req: Request,
  res: Response<ApiResponse | ApiErrorResponse>,
  _next: NextFunction
): Promise<void> => {
  try {
    const summary = await scanAndUpdateOverdueInvoices();
    res.status(200).json({
      success: true,
      data: { summary },
    });
  } catch (error) {
    console.error('Trigger Overdue Scan Error:', error);
    res.status(500).json({ success: false, message: 'Failed to execute overdue scan' });
  }
};
