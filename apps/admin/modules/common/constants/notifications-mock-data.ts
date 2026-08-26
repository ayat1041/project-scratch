import { Notification } from '../types/domain';

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    title: 'New user registered',
    time: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    read: false,
  },
  {
    id: 2,
    title: 'Role permissions updated',
    time: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    read: false,
  },
  {
    id: 3,
    title: 'Settings updated successfully',
    time: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: true,
  },
  {
    id: 4,
    title: 'System maintenance scheduled',
    time: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    read: true,
  },
];
