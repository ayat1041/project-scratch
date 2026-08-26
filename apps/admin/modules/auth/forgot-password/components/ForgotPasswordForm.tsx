'use client';

import Link from 'next/link';
import { useState } from 'react';
import ArrowButton from '@repo/ui/components/ui/arrow-button';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Mail } from 'lucide-react';
import { handleForgotPassword } from '@modules/auth/handlers/auth.handlers';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [verificationLink, setVerificationLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    // Simulate API call
    setTimeout(async () => {
      if (!email || !email.includes('@')) {
        setErrorMessage('Please enter a valid email address.');
      } else {
        try {
          const result = await handleForgotPassword(email);
          setIsSubmitted(true);
          setVerificationLink(result.success ? (result._links?.redirectUrl ?? null) : null);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('forgot-password-submitted', 'true');
            window.dispatchEvent(new Event('forgot-password-submitted'));
          }
        } catch (error) {
          const err = error as { message?: string };
          setErrorMessage(err.message || 'An error occurred during sign up');
        }
      }
      setIsSubmitting(false);
    }, 1200);
  };

  if (isSubmitted) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
          <Mail className="h-8 w-8 text-green-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-foreground text-lg font-semibold">
            Check your inbox
          </h2>
          <p className="text-muted-foreground text-sm">
            We&apos;ve sent password reset instructions to{' '}
            <span className="text-foreground font-medium">{email}</span>
          </p>
        </div>
        {verificationLink && (
          <div className="bg-muted mt-4 rounded-md p-4">
            <p className="text-muted-foreground text-sm">
              For development purposes, you can use this verification link:
            </p>
            <Link
              href={verificationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block max-w-[382px] text-sm break-all text-blue-600 underline"
              data-testid="verification-link"
            >
              {verificationLink}
            </Link>
          </div>
        )}
        <div className="pt-4">
          <Button
            variant="outline"
            onClick={() => {
              setIsSubmitted(false);
              setEmail('');
              setVerificationLink(null);
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('forgot-password-submitted', 'false');
                window.dispatchEvent(new Event('forgot-password-submitted'));
              }
            }}
            className="w-full"
            data-testid="different-email-button"
          >
            Send to a different email
          </Button>
        </div>
      </div>
    );
  } else {
    return (
      <form onSubmit={handleSubmit}>
        {errorMessage && (
          <div className="border-danger bg-danger/10 text-danger mb-4 rounded border p-3">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="border-success bg-success/10 text-success mb-4 rounded border p-3">
            {successMessage}
          </div>
        )}
        <div className="mb-[25px] space-y-2">
          <label
            htmlFor="email"
            className="text-md block font-medium text-black"
          >
            Email address
          </label>
          <div className="relative">
            {/* Email icon (same as SignUpForm) */}
            <Mail
              className={`text-muted-foreground absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2`}
            />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              className="border-gray placeholder:text-gray md: text-text h-12 pr-10 pl-10 text-base font-medium outline-none md:w-[382px] md:text-base"
              value={email}
              onChange={e => setEmail(e.target.value)}
              data-testid="forgot-email-input"
              required
            />
          </div>
        </div>
        <ArrowButton
          type="submit"
          className="h-14 w-full rounded-2xl md:h-14"
          disabled={isSubmitting}
          data-testid="submit-button"
          label={isSubmitting ? 'Sending...' : 'Send Reset Link'}
        />
      </form>
    );
  }
}
