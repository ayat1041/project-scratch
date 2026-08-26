export const AUTH_ENDPOINTS = {
  SIGN_IN: '/auth/v1/sign-in',
  SIGN_UP: '/auth/v1/sign-up',
  SIGN_OUT: '/auth/v1/sign-out',
  SESSION_INFO: '/auth/v1/session-info',
  CHECK_EMAIL_UNIQUENESS: '/auth/v1/check-email-uniqueness',
  FORGOT_PASSWORD: '/auth/v1/forgot-password',
  RESET_PASSWORD: '/auth/v1/reset-password',
  VERIFY_EMAIL: '/auth/v1/verify-email',
  RESEND_EMAIL_VERIFICATION: '/auth/v1/resend-email-verification-link',
  VALIDATE_RESET_CODE: '/auth/validate-reset-code',
  RESEND_FORGOT_PASSWORD_OTP: '/auth/resend-forgot-password-otp',
} as const;
