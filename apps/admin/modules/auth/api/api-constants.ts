export const AUTH_ENDPOINTS = {
  SIGN_IN:                      () => `/auth/v1/sign-in`,
  FORGOT_PASSWORD:              () => `/auth/v1/forgot-password`,
  RESEND_FORGOT_PASSWORD_OTP:   () => `/auth/resend-forgot-password-otp`,
  VALIDATE_RESET_CODE:          () => `/auth/validate-reset-code`,
  VALIDATE_RESET_PASSWORD_LINK: () => `/auth/v1/validate-reset-password-link`,
  RESET_PASSWORD:               () => `/auth/v1/reset-password`,
  SESSION_INFO:                 () => `/auth/v1/session-info`,
} as const;
