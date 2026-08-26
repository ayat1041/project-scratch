import { toast } from 'sonner';
import { handleErrorToast } from '@repo/utilities/errors/error-toasts';
import * as authService from '../services/auth-service';
import type { SigninResponse, ForgotPasswordResponse, ValidateResetCodeResponse } from '@repo/schemas-types/payload-schemas/auth/Response.type';
import type { ResetPasswordPayloadValidationSchemaType } from '@repo/schemas-types/payload-schemas/auth/Payload.schema';

export const handleSignIn = async (credentials: {
  email: string;
  password: string;
}): Promise<SigninResponse> => {
  try {
    const result = await authService.signIn(credentials);
    toast.success('Signed in successfully!');
    return result;
  } catch (error) {
    handleErrorToast(error, 'Sign in failed');
    throw error;
  }
};

export const handleForgotPassword = async (email: string): Promise<ForgotPasswordResponse> => {
  try {
    const result = await authService.forgotPassword(email);
    toast.success('Verification code sent to your email!');
    return result;
  } catch (error) {
    handleErrorToast(error, 'Failed to send reset code');
    throw error;
  }
};

export const handleResendForgotPasswordOtp = async (email: string): Promise<void> => {
  try {
    await authService.resendForgotPasswordOtp(email);
    toast.success('Verification code resent!');
  } catch (error) {
    handleErrorToast(error, 'Failed to resend verification code');
    throw error;
  }
};

export const handleVerifyChangePasswordOtp = async (
  email: string,
  code: string
): Promise<ValidateResetCodeResponse> => {
  try {
    const result = await authService.validateResetCode(email, code);
    toast.success('Email verified successfully!');
    return result;
  } catch (error) {
    handleErrorToast(error, 'Email verification failed');
    throw error;
  }
};

export const handleResetPassword = async (payload: ResetPasswordPayloadValidationSchemaType): Promise<void> => {
  try {
    await authService.resetPassword(payload);
    toast.success('Password reset successfully!');
  } catch (error) {
    handleErrorToast(error, 'Password reset failed');
    throw error;
  }
};
