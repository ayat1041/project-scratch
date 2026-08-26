import { ArrowLeft, Lock } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

import SectionContainer from '@repo/ui/components/containers/SectionContainer';
import ForgotPasswordForm from '@modules/auth/forgot-password/components/ForgotPasswordForm';

import ForgotPasswordSubtitle from '@modules/auth/forgot-password/components/ForgotPasswordSubtitle';

// import GoogleSignInButton from '../components/GoogleSignInButton';

export const metadata: Metadata = {
  title: 'Forgot Password | Starter',
  description: 'Welcome back! Please enter your email to reset your password.',
};

export default function ForgotPage() {
  return (
    <SectionContainer className="bg-background w-full md:bg-transparent flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center justify-center gap-6 px-2.5 xl:px-8">
        <div className="flex flex-col items-center justify-center gap-[5px]">
          <div className="bg-primary/10 mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
            <Lock className="text-primary h-8 w-8" />
          </div>
          <h1 className="text-foreground text-2xl font-bold">Reset Password</h1>
          <ForgotPasswordSubtitle />
        </div>
        <div className="bg-card border-border rounded-2xl border p-8 shadow-lg">
          <div>
            <ForgotPasswordForm />
          </div>
          <div className="mt-7 flex flex-col justify-center">
            <span className="bg-border mb-4 block h-[0.5px] w-full" />
            <p className="text-muted-foreground text-md text-center leading-[20px] font-medium md:text-base">
              <Link
                href="/auth/signin"
                className="text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 text-sm transition-colors"
                data-testid="signin-link"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Sign In
              </Link>
            </p>
            {/* <div className="mb-8 flex items-center justify-center gap-2">
              <span className="block h-[1px] w-full bg-gray"></span>
              <p className="text-sm font-bold text-gray">OR</p>
              <span className="block h-[1px] w-full bg-gray"></span>
            </div> */}
            {/* <GoogleSignInButton /> */}
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
