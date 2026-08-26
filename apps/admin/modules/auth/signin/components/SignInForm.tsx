'use client';

import { useEffect, useState } from 'react';
import { Resolver, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch } from 'react-redux';
import PasswordVisibilityToggle from '@repo/ui/components/common/PasswordVisibilityToggle';
import Link from 'next/link';

import { Input } from '@repo/ui/components/ui/input';
import { cn } from '@repo/ui/lib/utils';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/ui/form';

import { useUserAuth } from '@/context/auth-context';

import { resetUser } from '@/store/user-info';

import ArrowButton from '@repo/ui/components/ui/arrow-button';
import { handleSignIn } from '@modules/auth/handlers/auth.handlers';
import { SigninPayloadValidationSchema } from '@repo/schemas-types/payload-schemas/auth/Payload.schema';
import type { SigninPayloadValidationSchemaType } from '@repo/schemas-types/payload-schemas/auth/Payload.schema';

interface SignInFormProps {
  noCallbacks?: boolean;
  dialog?: boolean;
}

const SAFE_REDIRECT_FALLBACK = '/';

const getSafeCallbackUrl = (rawValue: string | null): string => {
  if (!rawValue) {
    return SAFE_REDIRECT_FALLBACK;
  }

  let decoded = rawValue;
  try {
    decoded = decodeURIComponent(rawValue);
  } catch {
    // If decoding fails, fall back to the raw value.
    decoded = rawValue;
  }

  const trimmed = decoded.trim();

  if (!trimmed.startsWith('/')) {
    return SAFE_REDIRECT_FALLBACK;
  }

  if (trimmed.startsWith('//')) {
    return SAFE_REDIRECT_FALLBACK;
  }

  try {
    const candidate = new URL(trimmed, 'https://example.com');
    if (candidate.origin !== 'https://example.com') {
      return SAFE_REDIRECT_FALLBACK;
    }
    return `${candidate.pathname}${candidate.search}${candidate.hash}`;
  } catch {
    return SAFE_REDIRECT_FALLBACK;
  }
};

export const emailIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="19"
    height="19"
    viewBox="0 0 19 19"
    fill="none"
  >
    <path
      d="M2.13281 5.33325L7.31758 8.27098C9.22901 9.354 10.0366 9.354 11.9481 8.27098L17.1328 5.33325"
      stroke="var(--gray)"
      strokeWidth="1.125"
      strokeLinejoin="round"
    />
    <path
      d="M2.14464 10.94C2.19367 13.2392 2.21819 14.3887 3.06653 15.2403C3.91487 16.0919 5.09556 16.1215 7.45694 16.1808C8.91229 16.2174 10.3533 16.2174 11.8087 16.1808C14.1701 16.1215 15.3507 16.0919 16.1991 15.2403C17.0475 14.3887 17.072 13.2392 17.121 10.94C17.1368 10.2007 17.1368 9.46583 17.121 8.72655C17.072 6.4274 17.0475 5.27782 16.1991 4.42625C15.3507 3.57468 14.1701 3.54501 11.8087 3.48568C10.3533 3.44911 8.91229 3.44911 7.45693 3.48567C5.09556 3.545 3.91487 3.57466 3.06653 4.42624C2.21818 5.27781 2.19367 6.42739 2.14463 8.72655C2.12887 9.46583 2.12888 10.2007 2.14464 10.94Z"
      stroke="var(--gray)"
      strokeWidth="1.125"
      strokeLinejoin="round"
    />
  </svg>
);

export const passwordIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="19"
    height="19"
    viewBox="0 0 19 19"
    fill="none"
  >
    <path
      d="M11.5011 12.4583H11.5078M7.75781 12.4583H7.76454"
      stroke="var(--gray)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.83367 14.9668C4.00233 16.2195 5.03991 17.2009 6.30256 17.2589C7.36501 17.3078 8.44429 17.3333 9.63281 17.3333C10.8213 17.3333 11.9006 17.3078 12.963 17.2589C14.2257 17.2009 15.2633 16.2195 15.432 14.9668C15.5421 14.1493 15.6328 13.3115 15.6328 12.4583C15.6328 11.6051 15.5421 10.7672 15.432 9.94973C15.2633 8.697 14.2257 7.71562 12.963 7.65757C11.9006 7.60873 10.8213 7.58325 9.63281 7.58325C8.44429 7.58325 7.36501 7.60873 6.30256 7.65757C5.03991 7.71562 4.00233 8.697 3.83367 9.94973C3.7236 10.7672 3.63281 11.6051 3.63281 12.4583C3.63281 13.3115 3.7236 14.1493 3.83367 14.9668Z"
      stroke="var(--gray)"
      strokeWidth="1.125"
    />
    <path
      d="M6.25781 7.58325V5.70825C6.25781 3.84429 7.76885 2.33325 9.63281 2.33325C11.4968 2.33325 13.0078 3.84429 13.0078 5.70825V7.58325"
      stroke="var(--gray)"
      strokeWidth="1.125"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const fullNameIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="19"
    height="19"
    viewBox="0 0 19 19"
    fill="none"
  >
    <path
      d="M13.6641 7.20825C13.6641 5.13719 11.9851 3.45825 9.91406 3.45825C7.843 3.45825 6.16406 5.13719 6.16406 7.20825C6.16406 9.2793 7.843 10.9583 9.91406 10.9583C11.9851 10.9583 13.6641 9.2793 13.6641 7.20825Z"
      stroke="var(--gray)"
      strokeWidth="1.125"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.1641 16.2083C15.1641 13.3088 12.8136 10.9583 9.91406 10.9583C7.01457 10.9583 4.66406 13.3088 4.66406 16.2083"
      stroke="var(--gray)"
      strokeWidth="1.125"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function SignInForm({
  noCallbacks = false,
  dialog = false,
}: SignInFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { checkAuth } = useUserAuth();
  const dispatch = useDispatch();

  useEffect(() => {
    // 100ms ensures the component is mounted before reading URL params
    const timer = setTimeout(() => {
      const searchParams = new URLSearchParams(window.location.search);
      const error = searchParams.get('error');

      if (error) {
        const errorMessage = error
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        setErrorMessage(errorMessage);

        // toast.error(errorMessage, {
        //   duration: 5000,
        // });

        searchParams.delete('error');
        const newUrl = searchParams.toString()
          ? `${window.location.pathname}?${searchParams.toString()}`
          : window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const form = useForm<SigninPayloadValidationSchemaType>({
    resolver: zodResolver(SigninPayloadValidationSchema) as Resolver<SigninPayloadValidationSchemaType>,
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const onSubmit = async (values: SigninPayloadValidationSchemaType) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await handleSignIn(values);
      window.location.href = (result.success ? result._links?.redirectUrl : undefined) || SAFE_REDIRECT_FALLBACK;
    } catch (error) {
      const err = error as { type?: string; details?: Record<string, string>; error?: string; message?: string };
      if (err.type === 'validation' && err.details) {
        Object.entries(err.details).forEach(([field, message]) => {
          form.setError(field as keyof SigninPayloadValidationSchemaType, {
            type: 'manual',
            message: message as string,
          });
        });
        setErrorMessage(err.error || 'Validation failed');
      } else {
        setErrorMessage(err.message || 'An error occurred during sign in');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const checkAuthentication = async () => {
      const authState = await checkAuth();
      return authState;
    };
    const runCheck = checkAuthentication();
    if (!runCheck) {
      dispatch(resetUser());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <FormItem className="mb-2.5 space-y-2 md:mb-[15px]">
              <FormLabel>Email</FormLabel>
              <FormControl>
                <div className="relative md:w-[382px]">
                  <span className="text-gray absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform">
                    {emailIcon}
                  </span>
                  <Input
                    {...field}
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    className={cn(
                      'border-gray placeholder:text-gray text-text h-12 rounded pr-10 text-base font-medium outline-none md:w-[382px] md:text-base',
                      fieldState.error && 'border-danger'
                    )}
                    data-testid="email-input"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <FormItem className="mb-2.5 space-y-2">
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative md:w-[382px]">
                  <span className="text-gray absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform">
                    {passwordIcon}
                  </span>
                  <Input
                    {...field}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className={cn(
                      'placeholder:text-gray border-gray text-text h-12 rounded pr-10 text-base font-medium outline-none md:text-base',
                      fieldState.error && 'border-danger'
                    )}
                    data-testid="password-input"
                    placeholder="Enter your password"
                  />
                  <PasswordVisibilityToggle
                    isVisible={showPassword}
                    onClick={togglePasswordVisibility}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {errorMessage && <p className="text-warning text-sm">{errorMessage}</p>}

        <ArrowButton
          type="submit"
          className="h-10 w-full rounded-2xl md:h-14"
          disabled={isSubmitting}
          data-testid="submit-button"
          label={isSubmitting ? 'Signing in...' : 'Sign In'}
        />

        <div className="mt-7 text-right">
          <Link
            href="/auth/forgot-password"
            className="text-primary hover:text-primary/80 text-sm transition-colors hover:underline"
          >
            Lost your password?
          </Link>
        </div>
      </form>
    </Form>
  );
}
