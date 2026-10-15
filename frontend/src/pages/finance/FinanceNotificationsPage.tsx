import React, { useEffect, useState } from 'react';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  ApiNotification,
} from '../../services/notificationService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Bell, CheckCheck, Landmark } from 'lucide-react';

export const FinanceNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNotificationsData = async () => {
    try {
      setLoading(true);
      const list = await getNotifications();
      setNotifications(list);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificationsData();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      fetchNotificationsData();
    } catch {
      // Catch
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      fetchNotificationsData();
    } catch {
      // Catch
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#0a0a0a]">Lender System Notifications</h1>
          <p className="text-xs text-[#737373] mt-1">
            Real-time underwriting alerts, financing disbursements, and institutional lifecycle updates
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            icon={<CheckCheck className="w-4 h-4" />}
            onClick={handleMarkAllRead}
          >
            Mark All as Read
          </Button>
        )}
      </div>

      <Card className="p-0 overflow-hidden shadow-popover">
        <div className="p-4 border-b border-[#e5e5e5] flex items-center justify-between bg-[#f5f5f5]">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-[#3b82f6]" />
            <span className="text-xs font-bold text-[#0a0a0a]">Notifications Inbox</span>
          </div>
          <span className="text-xs font-mono-num font-semibold text-[#3b82f6]">
            {unreadCount} Unread
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-[#737373]">Loading lender notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#737373] space-y-2">
            <Bell className="w-8 h-8 text-[#a3a3a3] mx-auto" />
            <p className="font-semibold text-sm text-[#0a0a0a]">No notifications available</p>
            <p>You have no pending financing alerts or underwriting updates at this time.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#e5e5e5]">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                  !n.isRead ? 'bg-[#3b82f6]/5' : 'hover:bg-[#f5f5f5]/60'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`p-2 rounded-lg text-white mt-0.5 ${
                      n.type === 'FINANCING' ? 'bg-[#3b82f6]' : 'bg-[#171717]'
                    }`}
                  >
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-xs text-[#0a0a0a]">{n.title}</h4>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#3b82f6] shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-[#404040] mt-1">{n.message}</p>
                    <p className="text-[10px] text-[#737373] mt-1 font-mono-num">
                      {new Date(n.createdAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {!n.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    className="text-xs text-[#3b82f6] hover:underline font-semibold shrink-0"
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
