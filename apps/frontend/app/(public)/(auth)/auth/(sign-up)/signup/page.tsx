import { Metadata } from 'next';
import Link from 'next/link';

import SignUpForm from '@modules/auth/sign-up/signup/components/SignUpForm';
import SectionContainer from '@repo/ui/components/containers/SectionContainer';

export const metadata: Metadata = {
  title: 'Sign Up | Starter',
  description: "Welcome to Starter! Let's get started by creating your account.",
};

export default function SignupPage() {
  return (
    <SectionContainer className="bg-background-auth w-full md:bg-transparent md:py-10">
      <div className="flex items-center justify-center px-2.5 xl:px-8">
        <div className="bg-card/80 border-border glow-card w-[448px] rounded-2xl border p-8 backdrop-blur-xl">
          <div className="flex flex-col items-center justify-center gap-[5px]">
            <h2 className="text-font-200 text-center text-lg font-semibold md:text-2xl">
              Create Your Account
            </h2>
          </div>
          <div className="mt-5 md:mt-[25px]">
            <SignUpForm />
          </div>
          <div className="mt-6 flex flex-col justify-center">
            <p className="text-muted-foreground text-md text-center leading-[20px] font-medium md:text-base">
              Already have an account?{' '}
              <Link
                href="/auth/signin"
                className="text-primary hover:underline"
                data-testid="signin-link"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
