'use client';

import { CheckCircle2 } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import Link from 'next/link';

export default function PasswordResetSuccess() {
  return (
    <div className="bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border-border rounded-2xl border p-8 text-center shadow-xl">
          <div className="bg-success/10 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
            <CheckCircle2 className="text-success h-8 w-8" />
          </div>
          <h1 className="text-foreground mb-2 text-2xl font-bold">
            Password Reset Complete
          </h1>
          <p className="text-muted-foreground mb-6">
            Your password has been successfully updated. You can now sign in
            with your new password.
          </p>
          <Button asChild className="bg-secondary w-full">
            <Link href="/auth/signin">Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
