import { toast } from 'sonner';
import { handleErrorToast } from '@repo/utilities/errors/error-toasts';
import * as authService from '../services/auth-service';
import type { EmailVerificationResponse, ResendVerificationResponse } from '@repo/schemas-types/payload-schemas/auth/Response.type';

export const handleVerifyEmail = async (
  token: string,
  email: string | null,
): Promise<EmailVerificationResponse> => {
  try {
    return await authService.verifyEmail(token, email);
  } catch (error) {
    handleErrorToast(error, 'Failed to verify email');
    throw error;
  }
};

export const handleResendEmailVerification = async (
  email: string,
  role: string,
): Promise<ResendVerificationResponse> => {
  try {
    const result = await authService.resendEmailVerification(email, role);
    toast.success(result.message || 'Verification email resent!');
    return result;
  } catch (error) {
    handleErrorToast(error, 'An unexpected error occurred');
    throw error;
  }
};
