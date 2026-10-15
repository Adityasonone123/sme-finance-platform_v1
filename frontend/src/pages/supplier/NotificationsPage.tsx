import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemoData } from '../../context/DemoDataContext';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  ApiNotification,
} from '../../services/notificationService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Bell, CheckCheck, AlertTriangle, Clock, Landmark, CreditCard } from 'lucide-react';
import { Notification, NotificationCategory } from '../../types/models';

export const NotificationsPage: React.FC = () => {
  const { notifications: demoNotifications } = useDemoData();
  const [notificationsList, setNotificationsList] = useState<Notification[]>(demoNotifications);
  const navigate = useNavigate();

  const loadRealNotifications = async () => {
    try {
      const dbNotifs = await getNotifications();
      if (dbNotifs && dbNotifs.length > 0) {
        const mappedNotifs: Notification[] = dbNotifs.map((dbN: ApiNotification) => {
          let category: NotificationCategory = 'SYSTEM';
          if (dbN.type === 'PAYMENT_OVERDUE') category = 'OVERDUE';
          else if (dbN.type === 'CASH_FLOW_WARNING') category = 'CASH_FLOW_WARNING';
          else if (dbN.type === 'PAYMENT_DUE') category = 'PAYMENT_DUE';
          else if (dbN.type === 'FINANCING') category = 'FINANCING';

          return {
            id: dbN.id,
            title: dbN.title,
            message: dbN.message,
            category,
            read: dbN.isRead,
            timestamp: new Date(dbN.createdAt).toISOString(),
            actionUrl: category === 'OVERDUE' ? '/invoices' : undefined,
          };
        });
        setNotificationsList(mappedNotifs);
      }
    } catch {
      // Fallback to demo notifications
    }
  };

  useEffect(() => {
    loadRealNotifications();
  }, []);

  const handleMarkAsRead = async (id: string, actionUrl?: string) => {
    await markNotificationAsRead(id);
    setNotificationsList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    if (actionUrl) navigate(actionUrl);
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    setNotificationsList((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'CASH_FLOW_WARNING':
        return <AlertTriangle className="w-5 h-5 text-[#ea580c]" />;
      case 'OVERDUE':
        return <Clock className="w-5 h-5 text-[#d32f2f]" />;
      case 'FINANCING':
        return <Landmark className="w-5 h-5 text-[#3b82f6]" />;
      case 'PAYMENT_DUE':
        return <CreditCard className="w-5 h-5 text-[#22863a]" />;
      default:
        return <Bell className="w-5 h-5 text-[#737373]" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#0a0a0a]">Notification Center</h1>
          <p className="text-xs text-[#737373] mt-1">Working capital alerts, payment updates, and credit events</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={<CheckCheck className="w-4 h-4" />}
          onClick={handleMarkAllRead}
        >
          Mark All as Read
        </Button>
      </div>

      <div className="space-y-3">
        {notificationsList.map((n) => (
          <Card
            key={n.id}
            onClick={() => handleMarkAsRead(n.id, n.actionUrl)}
            className={`p-4 transition-all hover:border-[#0a0a0a] cursor-pointer ${
              !n.read ? 'bg-[#fff7ed]/30 border-[#fb923c]/40' : ''
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-xl bg-white border border-[#e5e5e5] shadow-xs">
                {getCategoryIcon(n.category)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#0a0a0a]">{n.title}</h4>
                  <span className="text-[11px] font-mono-num text-[#737373]">
                    {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-[#404040] mt-1 leading-relaxed">{n.message}</p>
              </div>
              {!n.read && <span className="w-2 h-2 rounded-full bg-[#ea580c] mt-2 shrink-0" />}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
