import type { Metadata } from 'next';
import UsersPresenter from '@modules/users/components/Presenter';

export const metadata: Metadata = {
  title: 'Users',
};

interface UsersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default function AdminUsersPage({ searchParams }: UsersPageProps) {
  return <UsersPresenter searchParams={searchParams} />;
}
