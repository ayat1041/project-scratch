'use client';
import { useState, useEffect } from 'react';

// This component checks for the 'forgot-password-submitted' flag in sessionStorage to determine the subtitle
export default function ForgotPasswordSubtitle() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    // Listen for changes to the flag (set by ForgotPasswordForm)
    const checkFlag = () => {
      setIsSubmitted(
        typeof window !== 'undefined' &&
          sessionStorage.getItem('forgot-password-submitted') === 'true'
      );
    };
    checkFlag();
    window.addEventListener('forgot-password-submitted', checkFlag);
    return () =>
      window.removeEventListener('forgot-password-submitted', checkFlag);
  }, []);

  return (
    <p className="text-muted-foreground text-md mt-[0px] text-center font-normal tracking-[0%] md:text-base">
      {isSubmitted
        ? 'Check your email for instructions'
        : 'Enter your email to receive a reset link'}
    </p>
  );
}
