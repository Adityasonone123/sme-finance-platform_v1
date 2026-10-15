import { Notification } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export class NotificationServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'NotificationServiceError';
  }
}

export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
};

export const markNotificationAsRead = async (
  userId: string,
  notificationId: string
): Promise<Notification> => {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw new NotificationServiceError('Notification not found or access denied', 404);
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
};

export const markAllNotificationsAsRead = async (userId: string): Promise<number> => {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return result.count;
};
