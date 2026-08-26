'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, redirect } from 'next/navigation';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch } from 'react-redux';

import ArrowButton from '@repo/ui/components/ui/arrow-button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@repo/ui/components/ui/form';
import { setUserInfo } from '@/store/user-info';

import PinInput from '@modules/auth/components/shared/PinInput';
import { maskEmail } from '@repo/utilities/formatting/mask-email';
import { ROLES, ROUTES } from '@repo/constants';
import { OtpFormValidationSchema } from '@repo/schemas-types/payload-schemas/auth/Payload.schema';
import type { OtpFormValidationSchemaType } from '@repo/schemas-types/payload-schemas/auth/Payload.schema';
import {
  handleVerifyEmail,
  handleResendEmailVerification,
} from '@modules/auth/handlers/verification.handlers';

export default function EmailVerificationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  const email = searchParams.get('email');
  if (!email) redirect('/auth');

  const form = useForm<OtpFormValidationSchemaType>({
    resolver: zodResolver(OtpFormValidationSchema) as Resolver<OtpFormValidationSchemaType>,
    defaultValues: { code: '' },
  });

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
    setCanResend(true);
  }, [resendTimer]);

  const handleResendCode = async () => {
    if (!canResend || !email) return;
    try {
      await handleResendEmailVerification(email, ROLES.USER);
      setResendTimer(30);
      setCanResend(false);
    } catch {
      // toast already shown by handler
    }
  };

  const onSubmit = async (values: OtpFormValidationSchemaType) => {
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
      const result = await handleVerifyEmail(values.code, email);
      const userData = result.success ? result.data : undefined;
      dispatch(
        setUserInfo({
          isAuthenticated: true,
          id: userData?.userInfo?.id ?? null,
          userName: userData?.userInfo?.userName,
          email: userData?.userInfo?.email ?? '',
          profileImage: userData?.userInfo?.profileImage,
          providerName: userData?.userInfo?.providerName ?? '',
          roles: userData?.userInfo?.roles ?? [],
          isVerified: userData?.userInfo?.isVerified,
          registeredAt: userData?.userInfo?.registeredAt,
        })
      );
      router.push(ROUTES.USER.WELCOME.href);
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-[25px] text-center">
        <p className="text-font-100 text-md">
          Enter your 6 digit OTP code sent to{' '}
          <span className="text-text font-semibold">{maskEmail(email)}</span>
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {errorMessage && (
            <div className="border-danger bg-danger/10 text-danger mb-4 rounded border p-3">
              {errorMessage}
            </div>
          )}

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => {
              const value = typeof field.value === 'string' ? field.value : '';
              const onChange = (inputValue: string) =>
                field.onChange?.(inputValue);
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
            data-testid="verify-button"
            label={isSubmitting ? 'Verifying...' : 'Verify Email'}
          />

          <div className="text-center">
            <p className="text-font-100 text-md font-medium">
              {"Didn't receive the code? "}
            </p>
            {canResend ? (
              <button
                type="button"
                onClick={handleResendCode}
                className="text-secondary hover:text-secondary-hover cursor-pointer font-medium"
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
