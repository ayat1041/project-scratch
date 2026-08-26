import { Metadata } from 'next';

import SectionContainer from '@repo/ui/components/containers/SectionContainer';
import AuthLogo from '@repo/ui/components/common/AuthLogo';
import OtpChangePasswordForm from '@modules/auth/otp-change-password/components/OtpChangePasswordForm';

// import GoogleSignInButton from '../components/GoogleSignInButton';

export const metadata: Metadata = {
  title: 'Sign In | Starter Admin',
  description: 'Welcome back! Sign in to your Starter Admin account.',
};

export default async function OTPPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const email = params.email as string;

  return (
    <SectionContainer className="bg-background w-full md:bg-transparent">
      <div className="flex items-center justify-center px-2.5 xl:px-8">
        <div className="bg-card w-[355px] rounded-[10px] border-0 px-[27px] py-[20px] md:w-[600px] md:px-[50px] md:py-[40px]">
          <div className="flex flex-col items-center justify-center gap-[5px]">
            <AuthLogo />

            <h2 className="text-foreground mt-[15px] text-center text-lg font-semibold md:mt-10 md:text-3xl">
              Email Verification
            </h2>
          </div>
          <div className="mt-[5px]">
            <OtpChangePasswordForm email={email} />
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
