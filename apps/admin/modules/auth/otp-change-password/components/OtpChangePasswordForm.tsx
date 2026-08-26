'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@repo/ui/components/ui/form';

import {
  handleResendForgotPasswordOtp,
  handleVerifyChangePasswordOtp,
} from '@modules/auth/handlers/auth.handlers';
import PinInput from '@modules/auth/components/PinInput';
import ArrowButton from '@repo/ui/components/ui/arrow-button';
import { maskEmail } from '@repo/utilities/formatting/mask-email';
import { VerifyEmailCodePayloadValidationSchema } from '@repo/schemas-types/payload-schemas/auth/Payload.schema';
import type { VerifyEmailCodePayloadValidationSchemaType } from '@repo/schemas-types/payload-schemas/auth/Payload.schema';

export default function OtpChangePasswordForm({
  email,
}: {
  email: string | null;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const router = useRouter();
  // Remove pre-filling OTP code from query param

  const form = useForm<VerifyEmailCodePayloadValidationSchemaType>({
    resolver: zodResolver(VerifyEmailCodePayloadValidationSchema),
    defaultValues: {
      code: '',
    },
  });

  //   Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
      return () => {};
    }
  }, [resendTimer]);

  useEffect(() => {
    if (!email) {
      setErrorMessage('Email is missing. Please sign up again.');
      router.push(`/auth`);
    }
    return undefined;
  }, [email, router]);

  const handleResendCode = async () => {
    if (!canResend || !email) return;

    try {
      await handleResendForgotPasswordOtp(email);
      setResendTimer(30);
      setCanResend(false);
    } catch (_) {
      // toast handled by handler
    }
  };

  const onSubmit = async (values: VerifyEmailCodePayloadValidationSchemaType) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    if (!email) {
      setErrorMessage('Email is missing. Please sign up again.');
      setIsSubmitting(false);
      return;
    }

    if (values.code.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit code.');
      setIsSubmitting(false);
      return;
    }

    try {
      await handleVerifyChangePasswordOtp(email, values.code);
      router.push(`/reset-password?email=${encodeURIComponent(email!)}`);
    } catch (error) {
      const err = error as { message?: string };
      setErrorMessage(err.message || 'An error occurred during verification');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-[25px] text-center">
        <p className="text-foreground text-md">
          Enter your 6 digit OTP code sent to{' '}
          <span className="text-foreground font-semibold">{maskEmail(email)}</span>
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {errorMessage && (
            <div className="border-destructive bg-destructive/10 text-destructive mb-4 rounded border p-3">
              {errorMessage}
            </div>
          )}

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => {
              const value = typeof field.value === 'string' ? field.value : '';
              const onChange = field.onChange as (value: string) => void;

              return (
                <FormItem>
                  <FormControl>
                    <PinInput
                      value={value}
                      onChange={onChange}
                      length={6}
                      disabled={isSubmitting}
                      className="mb-6"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <ArrowButton
            type="submit"
            className="mb-15 h-10 w-full md:h-[50px] md:w-[500px]"
            disabled={isSubmitting || !email || form.watch('code').length !== 6}
            data-testid="submit-button"
            label={isSubmitting ? 'Verifying...' : 'Verify Email'}
          />

          <div className="text-center">
            <p className="text-foreground text-md font-medium">
              {"Didn't receive the code? "}
            </p>
            {canResend ? (
              <button
                type="button"
                onClick={handleResendCode}
                className="text-secondary hover:text-secondary/80 cursor-pointer font-medium"
                data-testid="resend-button"
              >
                Re-send OTP Code
              </button>
            ) : (
              <span className="text-secondary">
                Re-send OTP Code in {resendTimer}s
              </span>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
