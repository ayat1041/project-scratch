'use client';

import { useReducer } from 'react';
import { isPasswordValid } from '@repo/utilities/validation/password-requirements';
import { handleResetPassword } from '@modules/auth/handlers/password.handlers';
import PasswordResetSuccess from './PasswordResetSuccess';
import PasswordResetForm from './PasswordResetForm';

type State = {
  password: string;
  confirmPassword: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  isSuccess: boolean;
  showPasswords: { password: boolean; confirmPassword: boolean };
  fieldErrors: { password?: string | null; confirmPassword?: string | null };
};

type Action =
  | { type: 'SET_PASSWORD'; payload: string }
  | { type: 'SET_CONFIRM_PASSWORD'; payload: string }
  | { type: 'SET_IS_SUBMITTING'; payload: boolean }
  | { type: 'SET_ERROR_MESSAGE'; payload: string | null }
  | { type: 'SET_IS_SUCCESS'; payload: boolean }
  | { type: 'SET_SHOW_PASSWORDS'; payload: { password: boolean; confirmPassword: boolean } }
  | { type: 'SET_FIELD_ERRORS'; payload: { password?: string | null; confirmPassword?: string | null } };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_PASSWORD': return { ...state, password: action.payload };
    case 'SET_CONFIRM_PASSWORD': return { ...state, confirmPassword: action.payload };
    case 'SET_IS_SUBMITTING': return { ...state, isSubmitting: action.payload };
    case 'SET_ERROR_MESSAGE': return { ...state, errorMessage: action.payload };
    case 'SET_IS_SUCCESS': return { ...state, isSuccess: action.payload };
    case 'SET_SHOW_PASSWORDS': return { ...state, showPasswords: action.payload };
    case 'SET_FIELD_ERRORS': return { ...state, fieldErrors: action.payload };
    default: return state;
  }
}

const validateFields = (pw: string, cpw: string) => {
  const errs: { password?: string | null; confirmPassword?: string | null } = {};
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

export default function ResetPasswordForm({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const [state, dispatch] = useReducer(reducer, {
    password: '',
    confirmPassword: '',
    isSubmitting: false,
    errorMessage: null,
    isSuccess: false,
    showPasswords: { password: false, confirmPassword: false },
    fieldErrors: {},
  });
  const { password, confirmPassword, isSubmitting, errorMessage, isSuccess, showPasswords, fieldErrors } = state;
  const setPassword = (payload: string) => dispatch({ type: 'SET_PASSWORD', payload });
  const setConfirmPassword = (payload: string) => dispatch({ type: 'SET_CONFIRM_PASSWORD', payload });
  const setIsSubmitting = (payload: boolean) => dispatch({ type: 'SET_IS_SUBMITTING', payload });
  const setErrorMessage = (payload: string | null) => dispatch({ type: 'SET_ERROR_MESSAGE', payload });
  const setIsSuccess = (payload: boolean) => dispatch({ type: 'SET_IS_SUCCESS', payload });
  const setShowPasswords = (payload: { password: boolean; confirmPassword: boolean }) => dispatch({ type: 'SET_SHOW_PASSWORDS', payload });
  const setFieldErrors = (payload: { password?: string | null; confirmPassword?: string | null }) => dispatch({ type: 'SET_FIELD_ERRORS', payload });

  const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
    setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] });
  };

  const handlePasswordGenerated = (generatedPassword: string) => {
    setPassword(generatedPassword);
    setConfirmPassword(generatedPassword);
    setErrorMessage(null);
    setFieldErrors({});
  };

  const handlePasswordChange = (val: string) => {
    const sanitized = val.replace(/\s/g, '');
    setPassword(sanitized);
    setErrorMessage(null);
    setFieldErrors(validateFields(sanitized, confirmPassword));
  };

  const handleConfirmPasswordChange = (val: string) => {
    const sanitized = val.replace(/\s/g, '');
    setConfirmPassword(sanitized);
    setErrorMessage(null);
    setFieldErrors(validateFields(password, sanitized));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const validation = validateFields(password, confirmPassword);
    setFieldErrors(validation);
    if (!email || Object.values(validation).some(v => v)) {
      setErrorMessage('Please fix the form errors before submitting.');
      setIsSubmitting(false);
      return;
    }

    try {
      await handleResetPassword({
        email,
        password,
        confirmPassword,
        token,
      });
      setIsSuccess(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Network error occurred'
      );
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
