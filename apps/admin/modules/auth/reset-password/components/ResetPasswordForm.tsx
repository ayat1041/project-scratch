'use client';

import { useState } from 'react';
import { handleResetPassword } from '@modules/auth/handlers/auth.handlers';
import { isPasswordValid } from '@repo/utilities/validation/password-requirements';
import PasswordResetSuccess from './PasswordResetSuccess';
import PasswordResetForm from './PasswordResetForm';

export default function ResetPasswordForm({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirmPassword: false,
  });
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string | null;
    confirmPassword?: string | null;
  }>({});

  const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handlePasswordGenerated = (generatedPassword: string) => {
    setPassword(generatedPassword);
    setConfirmPassword(generatedPassword);
    setErrorMessage(null);
    setFieldErrors({});
  };

  const validateFields = (pw: string, cpw: string) => {
    const errs: { password?: string | null; confirmPassword?: string | null } =
      {};
    if (!pw) {
      errs.password = 'Password is required.';
    } else if (pw.length < 12) {
      errs.password = 'Password must be at least 12 characters.';
    } else if (pw.length > 64) {
      errs.password = 'Password must be at most 64 characters.';
    } else if (!isPasswordValid(pw)) {
      errs.password = 'Password must meet all requirements.';
    } else {
      errs.password = null;
    }

    if (!cpw) {
      errs.confirmPassword = 'Please confirm your password.';
    } else if (pw && cpw !== pw) {
      errs.confirmPassword = 'Passwords do not match.';
    } else {
      errs.confirmPassword = null;
    }

    return errs;
  };

  const handlePasswordChange = (val: string) => {
    // Remove spaces as they're not allowed by validation
    const sanitizedVal = val.replace(/\s/g, '');
    setPassword(sanitizedVal);
    setErrorMessage(null);
    const errs = validateFields(sanitizedVal, confirmPassword);
    setFieldErrors(errs);
  };

  const handleConfirmPasswordChange = (val: string) => {
    // Remove spaces as they're not allowed by validation
    const sanitizedVal = val.replace(/\s/g, '');
    setConfirmPassword(sanitizedVal);
    setErrorMessage(null);
    const errs = validateFields(password, sanitizedVal);
    setFieldErrors(errs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const validation = validateFields(password, confirmPassword);
    setFieldErrors(validation);
    const hasValidationError = Object.values(validation).some(v => v);
    if (!email || hasValidationError) {
      setErrorMessage('Please fix the form errors before submitting.');
      setIsSubmitting(false);
      return;
    }
    try {
      await handleResetPassword({ email, password, confirmPassword, token });
      setIsSuccess(true);
    } catch (error) {
      const err = error as { message?: string };
      setErrorMessage(err.message || 'Network error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordsMatch = password === confirmPassword && password !== '';

  return (
    <>
      {isSuccess ? (
        <PasswordResetSuccess />
      ) : (
        <PasswordResetForm
          errorMessage={errorMessage}
          password={password}
          onPasswordChange={handlePasswordChange}
          confirmPassword={confirmPassword}
          onConfirmPasswordChange={handleConfirmPasswordChange}
          showPasswords={showPasswords}
          onTogglePassword={() => togglePasswordVisibility('password')}
          onToggleConfirmPassword={() =>
            togglePasswordVisibility('confirmPassword')
          }
          fieldErrors={fieldErrors}
          isSubmitting={isSubmitting}
          email={email}
          onSubmit={handleSubmit}
          passwordsMatch={passwordsMatch}
          onPasswordGenerated={handlePasswordGenerated}
        />
      )}
    </>
  );
}
