import { fetchWithCookies } from '@repo/utilities/http/fetch-with-cookies';
import { fetchWithCookiesServer } from '@repo/utilities/http/fetch-with-cookies-server';
import { baseHeaders } from '@/constants/constants';
import type { SigninResponse, ValidationErrors, ForgotPasswordResponse, ValidateResetCodeResponse } from '@repo/schemas-types/payload-schemas/auth/Response.type';
import type { ResetPasswordPayloadValidationSchemaType } from '@repo/schemas-types/payload-schemas/auth/Payload.schema';
import { AUTH_ENDPOINTS as E } from './api-constants';

function createError(
  message: string,
  extra?: { type?: string; details?: ValidationErrors; error?: string }
) {
  const err = new Error(message) as Error & {
    type?: string;
    details?: ValidationErrors;
    error?: string;
  };
  if (extra?.type) err.type = extra.type;
  if (extra?.details) err.details = extra.details;
  if (extra?.error) err.error = extra.error;
  return err;
}

export async function signIn(credentials: {
  email: string;
  password: string;
}): Promise<SigninResponse> {
  const response = await fetchWithCookies(E.SIGN_IN(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  const data = await response.json();
  if (!response.ok) {
    throw createError(data.message || 'Authentication failed', {
      type: data.type,
      details: data.details,
      error: data.error,
    });
  }
  return data;
}

export async function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  const response = await fetchWithCookies(E.FORGOT_PASSWORD(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw createError(data.message || 'Failed to send reset code');
  }
  return {
    success: true,
    message: data.message,
    _links: data._links,
  };
}

export async function resendForgotPasswordOtp(email: string): Promise<void> {
  const response = await fetchWithCookies(E.RESEND_FORGOT_PASSWORD_OTP(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as { message?: string };
    throw createError(errorData.message || 'Failed to resend verification code');
  }
  await response.json().catch(() => { });
}

export async function validateResetCode(email: string, code: string): Promise<ValidateResetCodeResponse> {
  const response = await fetchWithCookies(E.VALIDATE_RESET_CODE(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw createError(data.message || 'Code validation failed', {
      type: data.type,
      details: data.details,
      error: data.error,
    });
  }
  return { success: true, message: data.message, data: data.data };
}

export async function resetPassword(payload: ResetPasswordPayloadValidationSchemaType): Promise<void> {
  const response = await fetchWithCookies(E.RESET_PASSWORD(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw createError(data.message || 'Password reset failed');
  }
}

// ─── Server-only calls (SSR / middleware, use fetchWithCookiesServer) ───────

export async function validateSession(
  origin: string
): Promise<{ isValid: boolean }> {
  try {
    const response = await fetchWithCookiesServer(
      `${E.SESSION_INFO()}?includeDetails=true`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Origin: origin,
          ...baseHeaders,
        },
        cache: 'no-store',
      }
    );
    if (!response.ok) return { isValid: false };
    const data = await response.json();
    return { isValid: Boolean(data.data) };
  } catch {
    return { isValid: false };
  }
}

export async function validateResetPasswordLink(
  token: string,
  email: string
): Promise<{ isValid: boolean }> {
  const res = await fetchWithCookiesServer(E.VALIDATE_RESET_PASSWORD_LINK(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, email }),
  });
  const data = await res.json();
  return { isValid: Boolean(data.success) };
}
