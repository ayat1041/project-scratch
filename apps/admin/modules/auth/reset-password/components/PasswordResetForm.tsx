'use client';

import { isPasswordValid } from '@repo/utilities/validation/password-requirements';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import ConfirmPasswordField from './ConfirmPasswordField';
import ErrorAlert from './ErrorAlert';
import NewPasswordField from './NewPasswordField';
import PasswordResetSubmit from './PasswordResetSubmit';

interface PasswordResetFormProps {
  errorMessage: string | null;
  password: string;
  onPasswordChange: (val: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (val: string) => void;
  showPasswords: {
    password: boolean;
    confirmPassword: boolean;
  };
  onTogglePassword: () => void;
  onToggleConfirmPassword: () => void;
  fieldErrors: {
    password?: string | null;
    confirmPassword?: string | null;
  };
  isSubmitting: boolean;
  email: string;
  onSubmit: (e: React.FormEvent) => void;
  passwordsMatch: boolean;
  onPasswordGenerated: (password: string) => void;
}

export default function PasswordResetForm({
  errorMessage,
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  showPasswords,
  onTogglePassword,
  onToggleConfirmPassword,
  fieldErrors,
  isSubmitting,
  email,
  onSubmit,
  passwordsMatch,
  onPasswordGenerated,
}: PasswordResetFormProps) {
  const allPasswordRequirementsMet = isPasswordValid(password);
  return (
    <div>
      <div className="mb-10 flex flex-col items-center justify-center">
        <div className="bg-primary/10 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl">
          <ShieldCheck className="text-primary h-8 w-8" />
        </div>
        <h1 className="text-foreground mb-2 text-3xl font-bold">
          Create New Password
        </h1>
        <p className="text-muted-foreground">
          Enter a strong password for your Starter Admin account
        </p>
      </div>
      <form
        onSubmit={onSubmit}
        className="bg-card border-border rounded-2xl border p-8 shadow-xl"
      >
        <ErrorAlert errorMessage={errorMessage} />
        <NewPasswordField
          password={password}
          onPasswordChange={onPasswordChange}
          showPassword={showPasswords.password}
          onToggle={onTogglePassword}
          error={fieldErrors.password || null}
          onPasswordGenerated={onPasswordGenerated}
        />
        <ConfirmPasswordField
          confirmPassword={confirmPassword}
          onConfirmPasswordChange={onConfirmPasswordChange}
          showPassword={showPasswords.confirmPassword}
          onToggle={onToggleConfirmPassword}
          error={fieldErrors.confirmPassword || null}
          disabled={!allPasswordRequirementsMet}
          passwordsMatch={passwordsMatch}
        />
        <PasswordResetSubmit
          isSubmitting={isSubmitting}
          email={email}
          password={password}
          confirmPassword={confirmPassword}
          fieldErrors={fieldErrors}
        />
        <div className="border-border mt-6 border-t pt-6">
          <p className="text-muted-foreground text-center text-sm md:w-[382px]">
            For security reasons, you will be asked to sign in again after
            resetting your password.
          </p>
        </div>
      </form>

      <p className="text-muted-foreground text-md mt-6 text-center">
        Remember your password?{' '}
        <Link
          href="/auth/signin"
          className="text-primary font-medium hover:underline"
          data-testid="signin-link"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
