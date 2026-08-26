'use client';

import PasswordVisibilityToggle from '@repo/ui/components/common/PasswordVisibilityToggle';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import type { SigninPayloadValidationSchemaType } from '@repo/schemas-types/payload-schemas/auth/Payload.schema';

import { useUserAuth } from '@/context/auth-context';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/ui/form';
import { Input } from '@repo/ui/components/ui/input';
import ArrowButton from '@repo/ui/components/ui/arrow-button';
import { cn } from '@repo/ui/lib/utils';

import { SigninPayloadValidationSchema } from '@repo/schemas-types/payload-schemas/auth/Payload.schema';
import { handleSignIn } from '@modules/auth/handlers/sign-in.handlers';

export default function SignInForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { checkAuth } = useUserAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      const searchParams = new URLSearchParams(window.location.search);
      const error = searchParams.get('error');

      if (error) {
        const readable = error
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        setErrorMessage(readable);
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
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-doctor/exhaustive-deps
  }, []);

  const onSubmit = async (values: SigninPayloadValidationSchemaType) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await handleSignIn(values.email, values.password);
      // navigation happens inside handleSignIn on success
    } catch (error) {
      const err = error as Error & { type?: string; details?: Record<string, string>; error?: string };
      if (err.type === 'validation' && err.details) {
        Object.entries(err.details).forEach(([field, message]) => {
          form.setError(field as keyof SigninPayloadValidationSchemaType, { type: 'manual', message });
        });
        setErrorMessage(err.error || 'Validation failed');
      } else {
        setErrorMessage(err.message || 'Sign in failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <FormItem className="mb-2.5 space-y-2 md:mb-5">
              <FormLabel className="text-[14px]">Email</FormLabel>
              <FormControl>
                <div className="relative md:w-[382px]">
                  <Input
                    {...field}
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className={cn(
                      'border-gray placeholder:text-gray h-12 rounded pr-10 text-sm outline-none placeholder:text-sm md:w-[382px]',
                      fieldState.error && 'border-warning'
                    )}
                    autoComplete="email"
                    data-testid="email-input"
                  />
                </div>
              </FormControl>
              <FormMessage className="text-warning text-sm" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-[14px]">Password</FormLabel>
              <FormControl>
                <div className="relative md:w-[382px]">
                  <Input
                    {...field}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className={cn(
                      'placeholder:text-gray border-gray h-12 rounded pr-10 text-sm outline-none',
                      fieldState.error && 'border-warning'
                    )}
                    autoComplete="current-password"
                    data-testid="password-input"
                    placeholder="Enter your password"
                  />
                  <PasswordVisibilityToggle
                    isVisible={showPassword}
                    onClick={() => setShowPassword(prev => !prev)}
                  />
                </div>
              </FormControl>
              <FormMessage className="text-warning text-sm" />
            </FormItem>
          )}
        />

        {errorMessage && (
          <p className="text-warning mt-2.5 text-sm">{errorMessage}</p>
        )}

        <div className="my-2.5 flex items-center justify-end md:my-5">
          <Link
            href="/auth/forgot-password"
            data-testid="forgot-password-link"
            className="text-primary text-sm font-medium hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        <ArrowButton
          type="submit"
          className="h-10 w-full rounded-2xl text-sm md:h-14"
          disabled={isSubmitting}
          data-testid="submit-button"
          label={isSubmitting ? 'Signing in...' : 'Sign In'}
        />
      </form>
    </Form>
  );
}
