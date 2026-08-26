'use client';

import { Button } from '@repo/ui/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/components/ui/popover';
import { Bell } from 'lucide-react';
import { useSyncExternalStore, useState } from 'react';
import { MOCK_NOTIFICATIONS } from '@modules/common/constants/notifications';
import { Notification } from '../types/domain';
import NotificationList from './NotificationList';

export default function NotificationButton() {
  const isMounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [notifications, setNotifications] =
    useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;


  const markNotificationAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Don't render until mounted on client to prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-accent relative cursor-pointer"
        >
          <Bell className="text-muted-foreground h-5 w-5" />
          {unreadCount > 0 && (
            <span className="bg-destructive text-destructive-foreground absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="border-border bg-popover z-50 w-80 border p-0"
      >
        <div className="border-border flex items-center justify-between border-b p-4">
          <h4 className="text-foreground font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllNotificationsAsRead}
              className="text-secondary text-xs hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>
        <NotificationList
          notifications={notifications}
          onNotificationClick={markNotificationAsRead}
        />
        <div className="border-border border-t p-3">
          <Button
            variant="ghost"
            className="text-secondary hover:text-secondary w-full text-sm"
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
