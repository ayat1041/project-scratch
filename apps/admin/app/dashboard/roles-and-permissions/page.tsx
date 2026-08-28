import type { Metadata } from 'next';
import RolesPresenter from '@modules/roles/components/Presenter';

export const metadata: Metadata = {
  title: 'Roles',
};

interface RolesAndPermissionsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default function AdminRolesPermissionsPage({ searchParams }: RolesAndPermissionsPageProps) {
  return <RolesPresenter searchParams={searchParams} />;
}
