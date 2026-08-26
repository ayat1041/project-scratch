import { toast } from 'sonner';
import { handleErrorToast } from '@repo/utilities/errors/error-toasts';
import * as authService from '../services/auth-service';
import type { ForgotPasswordResponse, ValidateResetCodeResponse } from '@repo/schemas-types/payload-schemas/auth/Response.type';
import type { ResetPasswordPayloadValidationSchemaType } from '@repo/schemas-types/payload-schemas/auth/Payload.schema';

export const handleForgotPassword = async (
  email: string,
): Promise<ForgotPasswordResponse> => {
  try {
    const result = await authService.forgotPassword(email);
    toast.success('Verification code sent to your email!');
    return result;
  } catch (error) {
    handleErrorToast(error, 'Failed to send verification code');
    throw error;
  }
};

export const handleResetPassword = async (
  payload: ResetPasswordPayloadValidationSchemaType,
): Promise<void> => {
  try {
    await authService.resetPassword(payload);
    toast.success('Password reset successfully!');
  } catch (error) {
    handleErrorToast(error, 'Failed to reset password');
    throw error;
  }
};

export const handleValidateResetCode = async (
  email: string,
  code: string,
): Promise<ValidateResetCodeResponse> => {
  try {
    return await authService.validateResetCode(email, code);
  } catch (error) {
    handleErrorToast(error, 'Failed to validate reset code');
    throw error;
  }
};

export const handleResendForgotPasswordOtp = async (
  email: string,
): Promise<void> => {
  try {
    await authService.resendForgotPasswordOtp(email);
    toast.success('Verification code resent!');
  } catch (error) {
    handleErrorToast(error, 'Failed to resend verification code');
    throw error;
  }
};
