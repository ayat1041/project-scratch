// Raw HTTP transport — every fetch in the auth module lives here and nowhere else.
// No business logic, no toast, no validation. Each function is a 1:1 mapping to an endpoint.

import { fetchWithCookies } from '@repo/utilities/http/fetch-with-cookies';
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
import type { ResetPasswordPayloadValidationSchemaType } from '@repo/schemas-types/payload-schemas/auth/Payload.schema';
import { AUTH_ENDPOINTS } from './api-constants';

type ApiErrorBody = { message?: string; type?: string; details?: Record<string, string>; error?: string };

function throwApiError(body: ApiErrorBody, status: number): never {
  const err = Object.assign(new Error(body.message || 'Request failed'), {
    status,
    statusCode: status,
    type: body.type,
    details: body.details,
    error: body.error,
  });
  throw err;
}

export async function signIn(
  email: string,
  password: string,
): Promise<SigninResponse> {
  const response = await fetchWithCookies(AUTH_ENDPOINTS.SIGN_IN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json() as ApiErrorBody;
  if (!response.ok) throwApiError(data, response.status);
  return data as SigninResponse;
}

export async function signUp(payload: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  timeZone?: string;
}): Promise<SignupResponse> {
  const response = await fetchWithCookies(AUTH_ENDPOINTS.SIGN_UP, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json() as ApiErrorBody;
  if (!response.ok) throwApiError(data, response.status);
  return data as SignupResponse;
}

export async function signOut(): Promise<void> {
  await fetchWithCookies(AUTH_ENDPOINTS.SIGN_OUT, {
    method: 'POST',
    headers: { 'Cache-Control': 'no-cache, no-store', Pragma: 'no-cache' },
  });
}

export async function getSessionInfo(): Promise<SessionInfoResponse> {
  const response = await fetchWithCookies(
    `${AUTH_ENDPOINTS.SESSION_INFO}?includeDetails=true`,
  );
  const data = await response.json() as ApiErrorBody;
  if (!response.ok) throwApiError(data, response.status);
  return data as SessionInfoResponse;
}

export async function checkEmailUniqueness(
  email: string,
): Promise<UniquenessCheckResponse> {
  const response = await fetchWithCookies(
    AUTH_ENDPOINTS.CHECK_EMAIL_UNIQUENESS,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    },
  );
  const data = await response.json() as ApiErrorBody;
  if (!response.ok) throwApiError(data, response.status);
  return data as UniquenessCheckResponse;
}

export async function forgotPassword(
  email: string,
): Promise<ForgotPasswordResponse> {
  const response = await fetchWithCookies(AUTH_ENDPOINTS.FORGOT_PASSWORD, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await response.json() as ApiErrorBody;
  if (!response.ok) throwApiError(data, response.status);
  return data as ForgotPasswordResponse;
}

export async function resetPassword(
  payload: ResetPasswordPayloadValidationSchemaType,
): Promise<void> {
  const response = await fetchWithCookies(AUTH_ENDPOINTS.RESET_PASSWORD, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as ApiErrorBody;
    throwApiError(data, response.status);
  }
}

export async function verifyEmail(
  token: string,
  email: string | null,
): Promise<EmailVerificationResponse> {
  const response = await fetchWithCookies(AUTH_ENDPOINTS.VERIFY_EMAIL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, email }),
    credentials: 'include',
  });
  const data = await response.json() as ApiErrorBody;
  if (!response.ok) throwApiError(data, response.status);
  return data as EmailVerificationResponse;
}

export async function resendEmailVerification(
  email: string,
  role: string,
): Promise<ResendVerificationResponse> {
  const response = await fetchWithCookies(
    AUTH_ENDPOINTS.RESEND_EMAIL_VERIFICATION,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
      credentials: 'include',
    },
  );
  const data = await response.json() as ApiErrorBody;
  if (!response.ok) throwApiError(data, response.status);
  return data as ResendVerificationResponse;
}

export async function validateResetCode(
  email: string,
  code: string,
): Promise<ValidateResetCodeResponse> {
  const response = await fetchWithCookies(AUTH_ENDPOINTS.VALIDATE_RESET_CODE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
  const data = await response.json() as ApiErrorBody;
  if (!response.ok) throwApiError(data, response.status);
  return data as ValidateResetCodeResponse;
}

export async function resendForgotPasswordOtp(email: string): Promise<void> {
  const response = await fetchWithCookies(
    AUTH_ENDPOINTS.RESEND_FORGOT_PASSWORD_OTP,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    },
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as ApiErrorBody;
    throwApiError(data, response.status);
  }
}
