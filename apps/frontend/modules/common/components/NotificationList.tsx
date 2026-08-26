import { formatDistanceToNow } from 'date-fns';
import { Notification } from '../types/domain';

interface NotificationListProps {
  notifications: Notification[];
  onNotificationClick: (id: number) => void;
}

const formatTime = (date: Date) => formatDistanceToNow(date, { addSuffix: true });

export default function NotificationList({
  notifications,
  onNotificationClick,
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground text-sm">No notifications</p>
      </div>
    );
  }

  return (
    <ul className="max-h-[300px] overflow-auto">
      {notifications.slice(0, 5).map(notification => (
        <li
          key={notification.id}
          className="border-border border-b last:border-b-0"
        >
          <button
            type="button"
            className="hover:bg-muted w-full cursor-pointer px-4 py-3 text-left transition-colors"
            onClick={() => onNotificationClick(notification.id)}
          >
            <div className="flex items-start gap-3">
              {!notification.read && (
                <span
                  className="bg-secondary mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                  aria-hidden="true"
                />
              )}

              <div className={!notification.read ? '' : 'ml-5'}>
                <p className="text-foreground text-sm font-medium">
                  {notification.title}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {formatTime(notification.time)}
                </p>
              </div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
