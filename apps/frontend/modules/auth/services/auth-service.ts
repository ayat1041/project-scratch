import { type ZodError } from 'zod';
import * as api from '../api/auth-api-service';
import {
  SigninPayloadValidationSchema,
  SignupPayloadValidationSchema,
  ForgotPasswordRequestPayloadValidationSchema,
  ResetPasswordPayloadValidationSchema,
} from '@repo/schemas-types/payload-schemas/auth/Payload.schema';
import type {
  SigninResponse,
  SignupResponse,
  SessionInfoResponse,
  EmailVerificationResponse,
  ForgotPasswordResponse,
  ResendVerificationResponse,
  UniquenessCheckResponse,
  ValidateResetCodeResponse,
} from '@repo/schemas-types/payload-schemas/auth/Response.type';
import type {
  ResetPasswordPayloadValidationSchemaType,
  SignupPayloadValidationSchemaType,
} from '@repo/schemas-types/payload-schemas/auth/Payload.schema';

function firstZodMessage(error: ZodError): string {
  return error.issues[0]?.message ?? 'Validation failed';
}

export async function signIn(
  email: string,
  password: string,
): Promise<SigninResponse> {
  const validated = SigninPayloadValidationSchema.safeParse({ email, password });
  if (!validated.success) throw new Error(firstZodMessage(validated.error));
  return api.signIn(validated.data.email, validated.data.password);
}

export async function signUp(
  payload: SignupPayloadValidationSchemaType & { timeZone?: string },
): Promise<SignupResponse> {
  const validated = SignupPayloadValidationSchema.safeParse(payload);
  if (!validated.success) throw new Error(firstZodMessage(validated.error));
  return api.signUp({ ...validated.data, timeZone: payload.timeZone });
}

export async function signOut(): Promise<void> {
  return api.signOut();
}

export async function getSessionInfo(): Promise<SessionInfoResponse> {
  return api.getSessionInfo();
}


export async function checkEmailUniqueness(
  email: string,
): Promise<UniquenessCheckResponse> {
  return api.checkEmailUniqueness(email);
}

export async function forgotPassword(
  email: string,
): Promise<ForgotPasswordResponse> {
  const validated = ForgotPasswordRequestPayloadValidationSchema.safeParse({ email });
  if (!validated.success) throw new Error(firstZodMessage(validated.error));
  return api.forgotPassword(validated.data.email);
}

export async function resetPassword(
  payload: ResetPasswordPayloadValidationSchemaType,
): Promise<void> {
  const validated = ResetPasswordPayloadValidationSchema.safeParse(payload);
  if (!validated.success) throw new Error(firstZodMessage(validated.error));
  return api.resetPassword(validated.data);
}

export async function verifyEmail(
  token: string,
  email: string | null,
): Promise<EmailVerificationResponse> {
  return api.verifyEmail(token, email);
}

export async function resendEmailVerification(
  email: string,
  role: string,
): Promise<ResendVerificationResponse> {
  return api.resendEmailVerification(email, role);
}

export async function validateResetCode(
  email: string,
  code: string,
): Promise<ValidateResetCodeResponse> {
  return api.validateResetCode(email, code);
}

export async function resendForgotPasswordOtp(email: string): Promise<void> {
  return api.resendForgotPasswordOtp(email);
}
