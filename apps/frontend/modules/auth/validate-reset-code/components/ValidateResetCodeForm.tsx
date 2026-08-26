'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import ArrowButton from '@repo/ui/components/ui/arrow-button';
import { handleValidateResetCode } from '@modules/auth/handlers/password.handlers';
import PinInput from '@modules/auth/components/shared/PinInput';

export default function ValidateResetCodeForm({ email }: { email: string }) {
  const router = useRouter();

  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !code || code.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit code.');
      setIsSubmitting(false);
      return;
    }

    try {
      await handleValidateResetCode(email, code);
      setSuccessMessage('Code validated! You may now set a new password.');
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 1200);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Network error occurred',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {errorMessage && (
        <div className="border-danger bg-danger/10 text-danger mb-4 rounded border p-3">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="border-success bg-success/10 text-success mb-4 rounded border p-3">
          {successMessage}
        </div>
      )}
      <div className="mb-6 space-y-2">
        <label htmlFor="code" className="text-md mb-2 block font-bold">
          Verification Code
        </label>
        <PinInput
          value={code}
          onChange={setCode}
          length={6}
          disabled={isSubmitting}
        />
      </div>
      <ArrowButton
        type="submit"
        className="mb-15 h-10 w-full md:h-[50px] md:w-[500px]"
        disabled={isSubmitting || code.length !== 6}
        data-testid="validate-reset-code-submit"
        label={isSubmitting ? 'Validating...' : 'Validate Code'}
      />
    </form>
  );
}
