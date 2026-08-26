import { Metadata } from 'next';
import Link from 'next/link';

import SectionContainer from '@repo/ui/components/containers/SectionContainer';
import ResetPasswordForm from '@modules/auth/reset-password/components/ResetPasswordForm';
import { fetchWithCookiesServer } from '@repo/utilities/http/fetch-with-cookies-server';
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

  const res = await fetchWithCookiesServer(
    '/auth/v1/validate-reset-password-link',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, email }),
    }
  );

  const data = await res.json();

  if (!data.success) {
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
    <SectionContainer className="bg-background flex min-h-screen w-full items-center justify-center p-0 md:bg-transparent md:p-0">
      <div className="flex items-center justify-center p-4">
        {/* <div className="w-full rounded-[10px] border-0 md:w-fit p-4"> */}
        <ResetPasswordForm email={email} token={token} />
      </div>
      {/* </div> */}
    </SectionContainer>
  );
}
