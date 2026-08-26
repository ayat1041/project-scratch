import { Metadata } from 'next';
// import Link from 'next/link';
// import { Suspense } from 'react';

import SectionContainer from '@repo/ui/components/containers/SectionContainer';

import SignInForm from '@modules/auth/signin/components/SignInForm';
import { Lock } from 'lucide-react';

// import GoogleSignInButton from '../components/GoogleSignInButton';

export const metadata: Metadata = {
  title: 'Sign In | Starter',
  description: 'Welcome back! Sign in to your Starter account.',
};

export default function SignInPage() {
  return (
    <SectionContainer className="bg-background-auth w-full md:bg-transparent">
      <div className="flex flex-col items-center justify-center px-2.5 xl:px-8">
        <div className="mb-8 text-center">
          <div className="bg-primary/10 mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
            <Lock className="text-primary h-8 w-8" />
          </div>
          <h1 className="text-foreground text-2xl font-bold">Admin Portal</h1>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>
        <div className="bg-card border-border rounded-lg border p-8 shadow-lg">
          <div className="mt-5 md:mt-[25px]">
            <SignInForm />
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
