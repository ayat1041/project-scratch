import { Metadata } from 'next';
import { Suspense } from 'react';

import SectionContainer from '@repo/ui/components/containers/SectionContainer';
import AuthLogo from '@repo/ui/components/common/AuthLogo';
import EmailVerificationForm from '@modules/auth/sign-up/email-verification/components/EmailVerificationForm';

export const metadata: Metadata = {
  title: 'Email Verification',
  description: 'Verify your email address',
};

export default function EmailVerificationPage() {
  return (
    <SectionContainer className="bg-background-auth w-full md:bg-transparent md:py-10">
      <div className="flex items-center justify-center px-2.5 xl:px-8">
        <div className="bg-background-card w-[355px] rounded-[10px] border-0 px-[27px] py-[20px] md:w-[600px] md:px-[50px] md:py-[40px]">
          <div className="flex flex-col items-center justify-center gap-[5px]">
            <AuthLogo />

            <h2 className="text-font-200 mt-[15px] text-center text-lg font-semibold md:mt-10 md:text-3xl">
              Email Verification
            </h2>
          </div>
          <div className="mt-[5px]">
            <Suspense
              fallback={
                <div className="bg-gray-light h-12 w-full animate-pulse rounded-lg"></div>
              }
            >
              <EmailVerificationForm />
            </Suspense>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
