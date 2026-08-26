import { Notification } from '@modules/common/types/domain';

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    title: 'Welcome to Starter! Take a look around your dashboard.',
    time: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    read: false,
  },
  {
    id: 2,
    title: 'Your profile was updated successfully.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false,
  },
  {
    id: 3,
    title: 'Your email address was verified.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    read: true,
  },
  {
    id: 4,
    title: 'A new feature is available — check your settings.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true,
  },
];
