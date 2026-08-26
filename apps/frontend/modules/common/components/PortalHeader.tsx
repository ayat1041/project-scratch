'use client';

import DashboardPortalHeader from '@/components/DashboardPortalHeader';
import NotificationButton from './NotificationButton';

export default function PortalHeader() {
  return <DashboardPortalHeader notificationSlot={<NotificationButton />} />;
}
