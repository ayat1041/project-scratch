import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import UserDetailPresenter from '@modules/users/components/detail/DetailPresenter';

export const metadata: Metadata = {
  title: 'Edit User',
};

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/users"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Edit User</h1>
      </div>

      <UserDetailPresenter id={id} />
    </div>
  );
}
