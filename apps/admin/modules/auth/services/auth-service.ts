import * as api from '../api/auth-api';
import type { SigninResponse, ForgotPasswordResponse, ValidateResetCodeResponse } from '@repo/schemas-types/payload-schemas/auth/Response.type';
import type { ResetPasswordPayloadValidationSchemaType } from '@repo/schemas-types/payload-schemas/auth/Payload.schema';

export async function signIn(credentials: {
  email: string;
  password: string;
}): Promise<SigninResponse> {
  return api.signIn(credentials);
}

export async function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  return api.forgotPassword(email);
}

export async function resendForgotPasswordOtp(email: string): Promise<void> {
  return api.resendForgotPasswordOtp(email);
}

export async function validateResetCode(email: string, code: string): Promise<ValidateResetCodeResponse> {
  return api.validateResetCode(email, code);
}

export async function resetPassword(payload: ResetPasswordPayloadValidationSchemaType): Promise<void> {
  return api.resetPassword(payload);
}

export async function validateSession(
  origin: string
): Promise<{ isValid: boolean }> {
  return api.validateSession(origin);
}

export async function validateResetPasswordLink(
  token: string,
  email: string
): Promise<{ isValid: boolean }> {
  return api.validateResetPasswordLink(token, email);
}
