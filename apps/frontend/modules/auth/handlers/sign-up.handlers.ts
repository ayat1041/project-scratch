import { handleErrorToast } from '@repo/utilities/errors/error-toasts';
import * as authService from '../services/auth-service';
import type { SignupResponse, UniquenessCheckResponse } from '@repo/schemas-types/payload-schemas/auth/Response.type';
import type { SignupPayloadValidationSchemaType } from '@repo/schemas-types/payload-schemas/auth/Payload.schema';

export const handleSignUp = async (
  payload: SignupPayloadValidationSchemaType & { timeZone?: string },
): Promise<SignupResponse> => {
  try {
    return await authService.signUp(payload);
  } catch (error) {
    handleErrorToast(error, 'Failed to sign up');
    throw error;
  }
};

export const handleCheckEmailUniqueness = async (
  email: string,
): Promise<UniquenessCheckResponse> => {
  try {
    return await authService.checkEmailUniqueness(email);
  } catch (error) {
    handleErrorToast(error, 'Failed to check email availability');
    throw error;
  }
};
