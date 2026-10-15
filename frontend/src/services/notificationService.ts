import { apiClient } from './api';

export interface ApiNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'PAYMENT_DUE' | 'PAYMENT_OVERDUE' | 'CASH_FLOW_WARNING' | 'FINANCING' | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
}

export interface NotificationApiResponse {
  success: boolean;
  data?: {
    notification?: ApiNotification;
    notifications?: ApiNotification[];
    count?: number;
  };
  message?: string;
}

export const getNotifications = async (): Promise<ApiNotification[]> => {
  try {
    const response = await apiClient.get<NotificationApiResponse>('/api/notifications');
    if (response.data.success && response.data.data?.notifications) {
      return response.data.data.notifications;
    }
    return [];
  } catch {
    return [];
  }
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  try {
    const response = await apiClient.get<NotificationApiResponse>('/api/notifications/unread-count');
    if (response.data.success && typeof response.data.data?.count === 'number') {
      return response.data.data.count;
    }
    return 0;
  } catch {
    return 0;
  }
};

export const markNotificationAsRead = async (id: string): Promise<boolean> => {
  try {
    const response = await apiClient.patch<NotificationApiResponse>(`/api/notifications/${id}/read`);
    return response.data.success;
  } catch {
    return false;
  }
};

export const markAllNotificationsAsRead = async (): Promise<boolean> => {
  try {
    const response = await apiClient.patch<NotificationApiResponse>('/api/notifications/read-all');
    return response.data.success;
  } catch {
    return false;
  }
};

export const triggerOverdueScan = async (): Promise<void> => {
  try {
    await apiClient.post('/api/notifications/trigger-overdue-scan');
  } catch {
    // Silent catch
  }
};
