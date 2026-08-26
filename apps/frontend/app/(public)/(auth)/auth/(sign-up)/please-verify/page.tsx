import { Metadata } from 'next';
import { Suspense } from 'react';

import { Send } from 'lucide-react';

import CheckEmailForm from '@modules/auth/sign-up/please-verify/components/CheckEmailForm';

export const metadata: Metadata = {
  title: 'Check Your Email',
  description: 'Verify your email address to continue',
};

export default function CheckEmailPage() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Send Icon */}
        <div className="flex justify-center">
          <div className="bg-primary/10 flex h-20 w-20 items-center justify-center rounded-full">
            <Send className="text-primary h-10 w-10" />
          </div>
        </div>

        {/* Message Content */}
        <div className="space-y-4">
          <h1 className="text-foreground text-2xl font-bold">
            Verify your email to continue
          </h1>

          <Suspense
            fallback={
              <div className="bg-muted h-12 w-full animate-pulse rounded-lg"></div>
            }
          >
            <CheckEmailForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
