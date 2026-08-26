import Link from 'next/link';
import { Metadata } from 'next';
import { Suspense } from 'react';

import AuthLogo from '@repo/ui/components/common/AuthLogo';

import SectionContainer from '@repo/ui/components/containers/SectionContainer';
import ValidateResetCodeForm from '@modules/auth/validate-reset-code/components/ValidateResetCodeForm';

export const metadata: Metadata = {
  title: 'Enter Verification Code',
  description: 'Validate your reset code',
};

export default async function ValidateResetCodePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const email = params.email as string;
  return (
    <SectionContainer className="bg-background w-full py-5 md:bg-transparent">
      <div className="flex items-center justify-center px-2.5 xl:px-8">
        <div className="bg-card w-[355px] rounded-[10px] border-0 px-[27px] py-[20px] md:w-[600px] md:px-[50px] md:py-[40px]">
          <div className="flex flex-col items-center justify-center gap-[5px]">
            <AuthLogo />
            <h2 className="text-foreground text-center text-3xl leading-[44px] font-bold">
              Enter Verification Code
            </h2>
            <p className="text-muted-foreground mt-[0px] mb-[32px] text-lg">
              Enter the code sent to your email to continue.
            </p>
          </div>
          <div className="mt-[5px]">
            <Suspense
              fallback={
                <div className="bg-muted h-12 w-full animate-pulse rounded-lg"></div>
              }
            >
              <ValidateResetCodeForm email={email} />
            </Suspense>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-md text-foreground mb-8 text-center font-medium">
              Back to{' '}
              <Link
                href="/signin"
                className="text-secondary hover:underline"
                data-testid="back-to-login-link"
              >
                Login Screen
              </Link>
            </p>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
