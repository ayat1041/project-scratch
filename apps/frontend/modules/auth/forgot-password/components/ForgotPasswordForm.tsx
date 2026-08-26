'use client';

import Link from 'next/link';
import { useReducer } from 'react';

import ArrowButton from '@repo/ui/components/ui/arrow-button';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Mail } from 'lucide-react';

import { handleForgotPassword } from '@modules/auth/handlers/password.handlers';

type State = {
  email: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  fieldError: string | null;
  isSubmitted: boolean;
  verificationLink: string | null;
};

type Action =
  | { type: 'SET_EMAIL'; payload: string }
  | { type: 'SET_IS_SUBMITTING'; payload: boolean }
  | { type: 'SET_ERROR_MESSAGE'; payload: string | null }
  | { type: 'SET_FIELD_ERROR'; payload: string | null }
  | { type: 'SET_IS_SUBMITTED'; payload: boolean }
  | { type: 'SET_VERIFICATION_LINK'; payload: string | null };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_EMAIL': return { ...state, email: action.payload };
    case 'SET_IS_SUBMITTING': return { ...state, isSubmitting: action.payload };
    case 'SET_ERROR_MESSAGE': return { ...state, errorMessage: action.payload };
    case 'SET_FIELD_ERROR': return { ...state, fieldError: action.payload };
    case 'SET_IS_SUBMITTED': return { ...state, isSubmitted: action.payload };
    case 'SET_VERIFICATION_LINK': return { ...state, verificationLink: action.payload };
    default: return state;
  }
}

const validateEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function ForgotPasswordForm() {
  const [state, dispatch] = useReducer(reducer, {
    email: '',
    isSubmitting: false,
    errorMessage: null,
    fieldError: null,
    isSubmitted: false,
    verificationLink: null,
  });
  const { email, isSubmitting, errorMessage, fieldError, isSubmitted, verificationLink } = state;
  const setEmail = (payload: string) => dispatch({ type: 'SET_EMAIL', payload });
  const setIsSubmitting = (payload: boolean) => dispatch({ type: 'SET_IS_SUBMITTING', payload });
  const setErrorMessage = (payload: string | null) => dispatch({ type: 'SET_ERROR_MESSAGE', payload });
  const setFieldError = (payload: string | null) => dispatch({ type: 'SET_FIELD_ERROR', payload });
  const setIsSubmitted = (payload: boolean) => dispatch({ type: 'SET_IS_SUBMITTED', payload });
  const setVerificationLink = (payload: string | null) => dispatch({ type: 'SET_VERIFICATION_LINK', payload });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setFieldError(null);

    if (!email.trim()) {
      setFieldError('Email address is required.');
      setIsSubmitting(false);
      return;
    }
    if (!validateEmail(email)) {
      setFieldError('Please enter a valid email address.');
      setIsSubmitting(false);
      return;
    }

    try {
      await handleForgotPassword(email);
      setIsSubmitted(true);
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line react-doctor/auth-token-in-web-storage -- UI state flag consumed by useSyncExternalStore in ForgotPasswordSubtitle, not an auth token
        sessionStorage.setItem('forgot-password-submitted', 'true');
        window.dispatchEvent(new Event('forgot-password-submitted'));
      }
    } catch (error) {
      const err = error as Error & { type?: string };
      if (err.type === 'validation') {
        setFieldError(err.message ?? 'Invalid email address.');
      } else {
        setErrorMessage(err.message ?? 'An error occurred. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
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
            We&apos;ve sent password reset instructions to <br />
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
              setFieldError(null);
              setErrorMessage(null);
              if (typeof window !== 'undefined') {
                // eslint-disable-next-line react-doctor/auth-token-in-web-storage -- UI state flag consumed by useSyncExternalStore in ForgotPasswordSubtitle, not an auth token
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
  }

  return (
    <form onSubmit={handleSubmit}>
      {errorMessage && (
        <div className="border-warning bg-danger/10 text-warning mb-4 rounded border p-3">
          {errorMessage}
        </div>
      )}
      <div className="mb-[25px] space-y-2">
        <label htmlFor="email" className="text-md block font-medium text-black">
          Email address
        </label>
        <div className="relative">
          <Mail className="text-muted-foreground absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />
          <Input
            id="email"
            type="email"
            placeholder="Enter your email address"
            className={`border-gray placeholder:text-gray text-text h-12 pr-10 pl-10 text-base font-medium outline-none md:w-[382px] md:text-base ${
              fieldError ? 'border-warning focus-visible:ring-warning' : ''
            }`}
            value={email}
            onChange={e => {
              setEmail(e.target.value);
              setFieldError(null);
            }}
            data-testid="forgot-email-input"
            required
          />
        </div>
        {fieldError && (
          <p className="text-warning mt-1 text-sm" data-testid="field-error">
            {fieldError}
          </p>
        )}
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
