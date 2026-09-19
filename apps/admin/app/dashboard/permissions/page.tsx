import type { Metadata } from 'next';
import PermissionsPresenter from '@modules/permissions/components/Presenter';

export const metadata: Metadata = {
  title: 'Permissions',
};

interface PermissionsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default function PermissionsPage({ searchParams }: PermissionsPageProps) {
  return <PermissionsPresenter searchParams={searchParams} />;
}
