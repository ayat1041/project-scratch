import type { Metadata } from 'next';
import SectionContainer from '@repo/ui/components/containers/SectionContainer';

export const metadata: Metadata = {
  title: 'Access Denied | Starter',
  description: 'You do not have permission to access this page.',
};

export default function AccessDeniedPage() {
  return (
    <SectionContainer className="flex min-h-screen items-center justify-center py-8">
      <div className="mx-auto w-full max-w-md">
        <p className="text-center text-2xl font-black">Access Denied</p>
      </div>
    </SectionContainer>
  );
}
