import { Metadata } from 'next';
import Link from 'next/link';

import SectionContainer from '@repo/ui/components/containers/SectionContainer';
import ResetPasswordForm from '@modules/auth/reset-password/components/ResetPasswordForm';
import { validateResetPasswordLink } from '@modules/auth/services/auth-service';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Enter code and new password',
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const email = params.email as string;
  const token = params.token as string;

  const { isValid } = await validateResetPasswordLink(token, email);

  if (!isValid) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card border-border rounded-2xl border p-8 text-center shadow-xl">
            <div className="bg-destructive/10 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
              <AlertTriangle className="text-destructive h-8 w-8" />
            </div>
            <h1 className="text-foreground mb-2 text-2xl font-bold">
              Link Expired
            </h1>
            <p className="text-muted-foreground mb-6">
              This password reset link has expired or is invalid. Please request
              a new one.
            </p>
            <Button asChild className="w-full">
              <Link href="/auth/forgot-password">Request New Link</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SectionContainer className="bg-background-auth w-full md:bg-transparent">
      <div className="flex items-center justify-center px-2.5 xl:px-8">
        <div className="w-full rounded-[10px] border-0 px-[27px] py-[20px] md:w-fit md:px-[50px]">
          <ResetPasswordForm email={email} token={token} />
        </div>
      </div>
    </SectionContainer>
  );
}
