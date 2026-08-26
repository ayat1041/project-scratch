// Auth response contract — the single source of truth for auth shapes that cross the API boundary.
// Consumed by backend, admin, and frontend. Request-side Zod schemas live in Payload.schema.ts.

import type {
    AppUsers,
    AppRoles,
    AppPermissions,
} from "../../tables/entity-types";

// ─── Shared data shapes ────────────────────────────────────────────────────────

export type SafeUser = Omit<AppUsers, "password">;

export type AuthUserInfo = Pick<
    SafeUser,
    "id" | "email" | "userName" | "profileImage" | "registeredAt"
>;

export type AuthRoleInfo = Pick<AppRoles, "id" | "name" | "scope">;
export type AuthPermissionInfo = Pick<AppPermissions, "id" | "name">;
export type PermissionMap = Record<string, AuthPermissionInfo[]>;

export type UserInfoPayload = Pick<
    SafeUser,
    "id" | "email" | "userName" | "profileImage" | "isVerified" | "isDeleted" | "registeredAt"
> &
    Pick<AppUsers, "providerName"> & {
        roles: string[];
        activeRole: string | null;
        permissions: string[];
        allowedRoutes: string[];
    };

export interface AuthSessionData {
    userInfo: AuthUserInfo;
    allowedRoutes: string[];
    roles: string[];
    permissions: string[];
}

// ─── Auth response envelope ────────────────────────────────────────────────────

// Discriminated union — same pattern as ApiResponse<T> but with auth-specific
// fields: optional data (some endpoints return no payload), token (non-prod
// debug only), and typed _links for HATEOAS redirects.
export type AuthApiResponse<TData = undefined, TLinks = undefined> =
    | {
        success: true;
        data?: TData;
        message?: string;
        /** Session token — only present in non-production environments for debugging. */
        token?: string;
        _links?: TLinks;
    }
    | {
        success: false;
        error: string;
        message: string;
        statusCode: number;
        details?: Record<string, unknown>;
    };

export type AuthRedirectLinks = { redirectUrl: string };

export type ValidationErrors = Record<string, string>;

// ─── Per-endpoint response types ──────────────────────────────────────────────

export type SigninResponse = AuthApiResponse<AuthSessionData, AuthRedirectLinks>;

export interface SignupResponseData {
    verificationLink?: string; // non-production only
}
export type SignupResponse = AuthApiResponse<SignupResponseData, AuthRedirectLinks>;

export interface EmailVerificationResponseData {
    userInfo?: UserInfoPayload;
}
export type EmailVerificationResponse = AuthApiResponse<EmailVerificationResponseData, AuthRedirectLinks>;

export type SessionInfoResponse = AuthApiResponse<AuthSessionData>;

export type SignoutResponse = AuthApiResponse<undefined, AuthRedirectLinks>;

export type ForgotPasswordResponse = AuthApiResponse<undefined, AuthRedirectLinks>;

// verificationLink is at response root (non-production only) per backend convention
export type ResendVerificationResponse = AuthApiResponse<undefined, AuthRedirectLinks> & {
    verificationLink?: string;
};

export type UniquenessCheckResponse = AuthApiResponse<{ isUnique: boolean }>;

export type ValidateResetCodeResponse = AuthApiResponse<undefined>;

// ─── Sign-in data (non-session-cookie flows) ───────────────────────────────────

export interface AuthSignInData {
    accessToken?: string;
    redirectUrl?: string;
    requiresVerification?: boolean;
}

export type AuthSignInApiResponse = AuthApiResponse<AuthSignInData>;
