import { formatDistanceToNow } from 'date-fns';

import { cn } from '@repo/ui/lib/utils';
import { Notification } from '../types/domain';

interface NotificationListProps {
  notifications: Notification[];
  onNotificationClick: (id: number) => void;
}

export default function NotificationList({
  notifications,
  onNotificationClick,
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-[#6b7280]">No notifications</p>
      </div>
    );
  }

  return (
    <div className="max-h-[400px] overflow-y-auto">
      {notifications.map(notification => (
        <button
          key={notification.id}
          onClick={() => onNotificationClick(notification.id)}
          className={cn(
            'flex w-full items-start gap-3 border-b border-gray-100 p-4 text-left transition-colors hover:bg-gray-50',
            !notification.read && 'bg-blue-50'
          )}
        >
          <div className="flex-1">
            <p
              className={cn(
                'text-sm',
                notification.read
                  ? 'text-[#6b7280]'
                  : 'font-medium text-[#1e1e1e]'
              )}
            >
              {notification.title}
            </p>
            <p className="mt-1 text-sm text-[#9ca3af]">
              {formatDistanceToNow(notification.time, { addSuffix: true })}
            </p>
          </div>
          {!notification.read && (
            <div className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
          )}
        </button>
      ))}
    </div>
  );
}
