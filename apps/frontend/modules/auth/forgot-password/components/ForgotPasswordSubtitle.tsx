'use client';
import { useSyncExternalStore } from 'react';

const subscribeForgotPassword = (cb: () => void) => {
  window.addEventListener('forgot-password-submitted', cb);
  return () => window.removeEventListener('forgot-password-submitted', cb);
};

// This component checks for the 'forgot-password-submitted' flag in sessionStorage to determine the subtitle
export default function ForgotPasswordSubtitle() {
  const isSubmitted = useSyncExternalStore(
    subscribeForgotPassword,
    () => sessionStorage.getItem('forgot-password-submitted') === 'true',
    () => false
  );

  return (
    <p className="text-muted-foreground text-md mt-[0px] text-center font-normal tracking-[0%] md:text-base">
      {isSubmitted
        ? 'Check your email for instructions'
        : 'Enter your email to receive a reset link'}
    </p>
  );
}
