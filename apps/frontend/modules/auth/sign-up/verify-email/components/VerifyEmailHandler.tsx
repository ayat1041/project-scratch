'use client';

import { CheckCircle, Clock, Loader2, Mail, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams, redirect } from 'next/navigation';
import { useEffect, useReducer, useState } from 'react';
import { useDispatch } from 'react-redux';

import ArrowButton from '@repo/ui/components/ui/arrow-button';
import { setUserInfo } from '@/store/user-info';
import { ROLES } from '@repo/constants';

import {
  handleVerifyEmail,
  handleResendEmailVerification,
} from '@modules/auth/handlers/verification.handlers';

type VerificationState = 'loading' | 'success' | 'error';

type State = {
  state: VerificationState;
  errorMessage: string;
  userEmail: string | null;
  isResending: boolean;
  emailResent: boolean;
  verificationLink: string | null;
};

type Action =
  | { type: 'SET_STATE'; payload: VerificationState }
  | { type: 'SET_ERROR_MESSAGE'; payload: string }
  | { type: 'SET_USER_EMAIL'; payload: string | null }
  | { type: 'SET_IS_RESENDING'; payload: boolean }
  | { type: 'SET_EMAIL_RESENT'; payload: boolean }
  | { type: 'SET_VERIFICATION_LINK'; payload: string | null };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_STATE': return { ...state, state: action.payload };
    case 'SET_ERROR_MESSAGE': return { ...state, errorMessage: action.payload };
    case 'SET_USER_EMAIL': return { ...state, userEmail: action.payload };
    case 'SET_IS_RESENDING': return { ...state, isResending: action.payload };
    case 'SET_EMAIL_RESENT': return { ...state, emailResent: action.payload };
    case 'SET_VERIFICATION_LINK': return { ...state, verificationLink: action.payload };
    default: return state;
  }
}

export default function VerifyEmailHandler() {
  const [verifyState, dispatchVerify] = useReducer(reducer, {
    state: 'loading',
    errorMessage: '',
    userEmail: null,
    isResending: false,
    emailResent: false,
    verificationLink: null,
  });
  const { state, errorMessage, userEmail, isResending, emailResent, verificationLink } = verifyState;
  const setState = (payload: VerificationState) => dispatchVerify({ type: 'SET_STATE', payload });
  const setErrorMessage = (payload: string) => dispatchVerify({ type: 'SET_ERROR_MESSAGE', payload });
  const setUserEmail = (payload: string | null) => dispatchVerify({ type: 'SET_USER_EMAIL', payload });
  const setIsResending = (payload: boolean) => dispatchVerify({ type: 'SET_IS_RESENDING', payload });
  const setEmailResent = (payload: boolean) => dispatchVerify({ type: 'SET_EMAIL_RESENT', payload });
  const setVerificationLink = (payload: string | null) => dispatchVerify({ type: 'SET_VERIFICATION_LINK', payload });

  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const token = searchParams.get('token');

  const [pendingRedirectUrl, setPendingRedirectUrl] = useState<string | null>(null);
  const [redirectReady, setRedirectReady] = useState(false);
  if (redirectReady && pendingRedirectUrl) redirect(pendingRedirectUrl);

  useEffect(() => {
    let redirectTimeout: ReturnType<typeof setTimeout>;

    const verify = async () => {
      if (!token) {
        setState('error');
        setErrorMessage('Invalid verification link. No token provided.');
        return;
      }

      try {
        const email = searchParams.get('email');
        const result = await handleVerifyEmail(token, email);

        if (result.success && result.data?.userInfo) {
          const userData = result.data.userInfo;
          dispatch(
            setUserInfo({
              id: userData.id ?? null,
              userName: userData.userName,
              email: userData.email ?? '',
              profileImage: userData.profileImage,
              providerName: userData.providerName ?? '',
              isAuthenticated: true,
              roles: userData.roles ?? [],
              isVerified: userData.isVerified,
              registeredAt: userData.registeredAt,
            })
          );
          setState('success');
          setPendingRedirectUrl(result._links?.redirectUrl ?? '/');
          redirectTimeout = setTimeout(() => setRedirectReady(true), 2000);
        } else {
          setState('error');
          setErrorMessage(
            result.message ?? 'Email verification failed. Please try again.'
          );
          setUserEmail(searchParams.get('email'));
        }
      } catch {
        setState('error');
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    };

    verify();
    return () => clearTimeout(redirectTimeout);
  }, [token, dispatch, searchParams]);

  const handleResendEmail = async () => {
    if (!userEmail) {
      router.push('/auth');
      return;
    }

    setIsResending(true);
    try {
      const result = await handleResendEmailVerification(userEmail, ROLES.USER);
      setEmailResent(true);
      setVerificationLink(result.verificationLink ?? null);
      setErrorMessage(
        result.message ?? 'A new verification link has been sent to your email.'
      );
    } catch {
      // toast already shown by handler
    } finally {
      setIsResending(false);
    }
  };

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-12">
        <Loader2 className="text-secondary h-16 w-16 animate-spin" />
        <p className="text-font-100 text-lg">Verifying your email&hellip;</p>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-12">
        <div className="bg-success/10 rounded-full p-3">
          <CheckCircle className="text-success h-6 w-6" />
        </div>
        <div className="space-y-2 text-center">
          <h3 className="text-text text-xl font-semibold">
            Email Verified Successfully!
          </h3>
          <p className="text-font-100 text-base">
            Your account has been verified. Redirecting you to complete your
            profile&hellip;
          </p>
        </div>
      </div>
    );
  }

  const isExpiredLink =
    errorMessage.toLowerCase().includes('expired') ||
    errorMessage.toLowerCase().includes('invalid');

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-12">
      <div
        className={`rounded-full p-3 ${emailResent ? 'bg-secondary/10' : 'bg-danger/10'}`}
      >
        {emailResent ? (
          <Mail className="text-secondary h-6 w-6" />
        ) : isExpiredLink ? (
          <Clock className="text-danger h-6 w-6" />
        ) : (
          <XCircle className="text-danger h-6 w-6" />
        )}
      </div>
      <div className="space-y-2 text-center">
        <h3 className="text-text text-xl font-semibold">
          {emailResent
            ? 'Check Your Email'
            : isExpiredLink
              ? 'Verification Link Expired'
              : 'Verification Failed'}
        </h3>
        <p className="text-font-100 text-base">
          {errorMessage ||
            'This verification link has expired. Please request a new one to continue.'}
        </p>
      </div>

      <div className="flex w-full flex-col gap-3 pt-4 md:w-auto md:flex-row">
        <ArrowButton
          type="button"
          onClick={handleResendEmail}
          className="h-auto w-full"
          disabled={isResending}
          isLoading={isResending}
          label={
            isResending
              ? 'Sending...'
              : userEmail
                ? 'Resend Verification Link'
                : 'Go to Sign Up'
          }
        />
      </div>
      {verificationLink && emailResent && (
        <div className="pt-4">
          <Link
            href={verificationLink}
            className="text-blue-500 underline hover:text-blue-700"
            data-testid="verification-link"
          >
            Click here to verify your email
          </Link>
        </div>
      )}
    </div>
  );
}
