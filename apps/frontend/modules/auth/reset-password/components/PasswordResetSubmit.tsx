'use client';

import { Button } from '@repo/ui/components/ui/button';

interface PasswordResetSubmitProps {
  isSubmitting: boolean;
  email: string;
  password: string;
  confirmPassword: string;
  fieldErrors: {
    password?: string | null;
    confirmPassword?: string | null;
  };
}

export default function PasswordResetSubmit({
  isSubmitting,
  password,
  confirmPassword,
  fieldErrors,
}: PasswordResetSubmitProps) {
  const hasFieldErrors = Object.values(fieldErrors).some(v => v);

  const isLoading = isSubmitting;
  const isCompliant = !hasFieldErrors;
  const passwordsMatch = password === confirmPassword;

  return (
    <Button
      type="submit"
      className="h-12 w-full text-base font-semibold"
      disabled={
        isLoading || !isCompliant || !passwordsMatch || !password.trim()
      }
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="border-primary-foreground/30 border-t-primary-foreground h-5 w-5 animate-spin rounded-full border-2" />
          Resetting Password&hellip;
        </div>
      ) : (
        'Reset Password'
      )}
    </Button>
  );
}
