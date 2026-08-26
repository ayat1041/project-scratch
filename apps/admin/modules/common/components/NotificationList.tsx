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
        <p className="text-muted-foreground text-sm">No notifications</p>
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
            'border-border hover:bg-muted flex w-full items-start gap-3 border-b p-4 text-left transition-colors',
            !notification.read && 'bg-info/10'
          )}
        >
          <div className="flex-1">
            <p
              className={cn(
                'text-sm',
                notification.read
                  ? 'text-muted-foreground'
                  : 'text-foreground font-medium'
              )}
            >
              {notification.title}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {formatDistanceToNow(notification.time, { addSuffix: true })}
            </p>
          </div>
          {!notification.read && (
            <div className="bg-info mt-1 h-2 w-2 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}
