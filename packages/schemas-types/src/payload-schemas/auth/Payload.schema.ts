// Auth payload schemas — request-side Zod schemas for auth endpoints.
// Response and session shapes live in Response.type.ts.
// This file serves as both Payload.schema.ts and payload.schema.ts on case-insensitive filesystems.

import z from "zod";
import sanitizeHtml from "sanitize-html";
import { SELF_REGISTRABLE_ROLES } from "@repo/constants";
import { appUsersSchema } from "../../tables/user-management/app_users";

// ─── Field builders ────────────────────────────────────────────────────────────

const emailField = appUsersSchema.shape.email.transform((val) =>
  val ? sanitizeHtml(val) : val,
);

const passwordField = appUsersSchema.shape.password
  .min(12, { message: "Password must be at least 12 characters" })
  .regex(/^\S*$/, { message: "Password cannot contain spaces" })
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/, {
    message:
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
  });

const passwordSigninField = appUsersSchema.shape.password;

const tokenField = z
  .string()
  .min(1, "Token is required")
  .max(2048, "Token is invalid");

const userNameField = appUsersSchema.shape.userName.min(2, {
  message: "Name must be at least 2 characters",
});

const roleField = z
  .string()
  .min(1, "Role is required")
  .refine((val) => (SELF_REGISTRABLE_ROLES as readonly string[]).includes(val), {
    message: "Invalid role",
  });

// ─── Request / payload schemas ────────────────────────────────────────────────

export const ResendEmailVerificationPayloadValidationSchema = z.object({
  role: roleField,
  email: emailField,
});
export type ResendEmailVerificationPayloadValidationSchemaType = z.infer<
  typeof ResendEmailVerificationPayloadValidationSchema
>;

export const SigninPayloadValidationSchema = z.object({
  email: emailField,
  password: passwordSigninField,
});
export type SigninPayloadValidationSchemaType = z.infer<
  typeof SigninPayloadValidationSchema
>;

export const SignupPayloadValidationSchema = z
  .object({
    name: userNameField,
    email: emailField,
    password: passwordField,
    confirmPassword: appUsersSchema.shape.password,
    role: roleField,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type SignupPayloadValidationSchemaType = z.infer<
  typeof SignupPayloadValidationSchema
>;

export const EmailVerificationPayloadValidationSchema = z.object({
  token: tokenField,
  email: emailField,
});
export type EmailVerificationPayloadValidationSchemaType = z.infer<
  typeof EmailVerificationPayloadValidationSchema
>;

export const ForgotPasswordRequestPayloadValidationSchema = z.object({
  email: emailField,
});
export type ForgotPasswordRequestPayloadValidationSchemaType = z.infer<
  typeof ForgotPasswordRequestPayloadValidationSchema
>;

export const ValidateResetPasswordLinkPayloadValidationSchema = z.object({
  token: tokenField,
  email: emailField,
});
export type ValidateResetPasswordLinkPayloadValidationSchemaType = z.infer<
  typeof ValidateResetPasswordLinkPayloadValidationSchema
>;

export const ResetPasswordPayloadValidationSchema = z
  .object({
    token: tokenField,
    email: emailField,
    password: passwordField,
    confirmPassword: appUsersSchema.shape.password,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordPayloadValidationSchemaType = z.infer<
  typeof ResetPasswordPayloadValidationSchema
>;

export const VerifyEmailCodePayloadValidationSchema = z.object({
  code: z
    .string()
    .min(1, { message: "Verification code is required" })
    .length(6, { message: "Verification code must be 6 characters" }),
});
export type VerifyEmailCodePayloadValidationSchemaType = z.infer<
  typeof VerifyEmailCodePayloadValidationSchema
>;

// Frontend-only OTP form schema — email is passed separately via URL params,
// so forms only capture the token field under the name "code".
export const OtpFormValidationSchema = z.object({ code: tokenField });
export type OtpFormValidationSchemaType = z.infer<
  typeof OtpFormValidationSchema
>;
