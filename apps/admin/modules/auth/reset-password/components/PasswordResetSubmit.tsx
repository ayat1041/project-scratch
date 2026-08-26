'use client';

import ArrowButton from '@repo/ui/components/ui/arrow-button';

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
  email,
  password,
  confirmPassword,
  fieldErrors,
}: PasswordResetSubmitProps) {
  const hasFieldErrors = Object.values(fieldErrors).some(v => v);
  const isFormInvalid =
    isSubmitting || !email || !password || !confirmPassword || hasFieldErrors;

  return (
    <>
      <div className="mb-[25px] flex w-full justify-end">
        <span className="text-md text-text ml-auto w-fit text-right font-medium md:text-base">
          {/* No forgot password link for reset form */}
        </span>
      </div>

      <ArrowButton
        type="submit"
        className="h-10 w-full rounded-2xl md:h-[50px]"
        disabled={isFormInvalid}
        data-testid="reset-password-submit"
        label={isSubmitting ? 'Resetting...' : 'Reset Password'}
      />
    </>
  );
}
