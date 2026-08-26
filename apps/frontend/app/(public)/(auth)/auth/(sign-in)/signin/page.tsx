import { Metadata } from 'next';

import SectionContainer from '@repo/ui/components/containers/SectionContainer';
import { Button } from '@repo/ui/components/ui/button';
import Link from 'next/link';
import GoogleSignInButton from '@modules/auth/google-signin/components/GoogleSignInButton';
import LinkedInSignInButton from '@modules/auth/linkedin-signin/components/LinkedInSignInButton';
import SignInForm from '@modules/auth/signin/components/SignInForm';

export const metadata: Metadata = {
  title: 'Sign In | Starter',
  description: 'Welcome back! Sign in to your Starter account.',
};

export default function SignInPage() {
  return (
    <SectionContainer className="bg-background w-full md:bg-transparent">
      <div className="flex items-center justify-center px-2.5 xl:px-8">
        <div className="bg-card border-border rounded-lg border p-8 shadow-lg">
          <div className="flex flex-col items-center justify-center gap-1.25">
            {/* <AuthLogo /> */}

            <h2 className="text-foreground text-center text-lg font-semibold md:text-2xl">
              Sign In to Starter
            </h2>
          </div>
          <div className="mt-5 md:mt-6.25">
            <SignInForm />
          </div>

          <div className="mt-1 flex flex-col justify-center">
            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="border-border w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card text-muted-foreground px-2">or</span>
              </div>
            </div>
            <GoogleSignInButton />
            <div className="h-4" />
            <LinkedInSignInButton />
            {/* Sign Up Link */}
            <div className="mt-8 text-center">
              <p className="text-muted-foreground text-sm">
                Don&apos;t have an Starter account?
              </p>
              <Link href="/auth/signup" className="mt-2 inline-block">
                <Button
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground mt-2 border-2 px-8 font-medium transition-all duration-200"
                >
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
