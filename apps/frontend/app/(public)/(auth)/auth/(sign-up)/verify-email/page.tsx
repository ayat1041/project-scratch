import { Metadata } from 'next';
import { Suspense } from 'react';

import SectionContainer from '@repo/ui/components/containers/SectionContainer';
import VerifyEmailHandler from '@modules/auth/sign-up/verify-email/components/VerifyEmailHandler';

export const metadata: Metadata = {
  title: 'Verifying Email',
  description: 'Verifying your email address',
};

export default function VerifyEmailPage() {
  return (
    <SectionContainer className="bg-background-auth w-full md:bg-transparent md:py-10">
      <div className="flex items-center justify-center px-2.5 xl:px-8">
        <div className="bg-background-card w-[355px] rounded-[10px] border-0 px-[27px] py-[20px] md:w-[600px] md:px-[50px] md:py-[40px]">
          <div className="flex flex-col items-center justify-center gap-[5px]"></div>
          <div className="mt-[5px]">
            <Suspense
              fallback={
                <div className="flex h-48 items-center justify-center">
                  <div className="border-gray-light border-t-secondary h-12 w-12 animate-spin rounded-full border-4"></div>
                </div>
              }
            >
              <VerifyEmailHandler />
            </Suspense>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
