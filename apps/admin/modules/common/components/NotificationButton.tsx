'use client';

import { Bell } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/components/ui/popover';
import { useState } from 'react';
import { MOCK_NOTIFICATIONS } from '../constants/notifications-mock-data';

import NotificationList from './NotificationList';
import { Notification } from '../types/domain';

export default function NotificationButton() {
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

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-[#6b7280]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-sm text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="z-50 w-80 border border-gray-200 bg-white p-0"
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h4 className="font-semibold text-[#1e1e1e]">Notifications</h4>
          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsAsRead}
              className="text-sm text-blue-600 hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>
        <NotificationList
          notifications={notifications}
          onNotificationClick={markNotificationAsRead}
        />
      </PopoverContent>
    </Popover>
  );
}
