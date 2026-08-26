'use client';

import Link from 'next/link';

import { Mail } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@repo/ui/components/ui/button';
import { ROLES } from '@repo/constants';
import { handleResendEmailVerification } from '@modules/auth/handlers/verification.handlers';

export default function CheckEmailForm() {
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const initialVerificationLink = searchParams.get('verificationLink');
  const [verificationLink, setVerificationLink] = useState<string | null>(
    initialVerificationLink,
  );

  const handleResendEmail = async () => {
    if (!email || resendTimer > 0) return;

    setIsResending(true);
    try {
      const result = await handleResendEmailVerification(email, ROLES.USER);
      if (result.success && result.verificationLink) {
        setVerificationLink(result.verificationLink);
      }
      setResendTimer(60);
      const interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      // toast already shown by handler
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground">
          We just sent an email to the address:
        </p>
        <p className="text-foreground font-medium">
          {email ? email : 'your email'}
        </p>
        <p className="text-muted-foreground">
          Please check your email and select the link provided to verify your
          address.
        </p>
      </div>

      <div className="space-y-3 pt-4">
        <p className="text-muted-foreground text-sm">
          Did not receive the email?
        </p>

        <Button
          variant="outline"
          onClick={handleResendEmail}
          className="gap-2"
          disabled={isResending || resendTimer > 0}
          data-testid="resend-email-button"
        >
          <Mail className="h-4 w-4" />
          {resendTimer > 0
            ? `Send again in ${resendTimer}s`
            : isResending
              ? 'Sending...'
              : 'Send again'}
        </Button>
      </div>

      {verificationLink && (
        <div className="space-y-2 pt-4">
          <p className="text-muted-foreground text-center text-sm">
            Verification Link:
          </p>
          <Link
            href={verificationLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-secondary-hover block text-center text-sm break-all underline"
            data-testid="verification-link"
          >
            {verificationLink}
          </Link>
        </div>
      )}
    </div>
  );
}
