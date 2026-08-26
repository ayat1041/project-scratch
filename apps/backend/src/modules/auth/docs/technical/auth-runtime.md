> **Status:** Draft
> **Version:** 2.0.0
> **Author:** <team-or-author>
> **Last updated:** 2026-08-26
> **Module:** `modules/auth`

## Overview / Purpose

The auth module manages identity entry points for first-party and OAuth sign-in, email verification, password reset, session lifecycle, and portal-context access control across main and admin surfaces. Its purpose is to keep account onboarding and authentication flows consistent while enforcing role-aware routing, anti-enumeration behavior, and session revocation guarantees.

## States / Modes

| State / Mode                   | Value                                                                | Description                                                                                    |
| ------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Signup role                    | `user`                                                               | The only role in `SELF_REGISTRABLE_ROLES`; verification token issued without any side entities. |
| User verification state        | `is_verified=false`                                                  | Account exists but cannot sign in; eligible for verification resend.                             |
| User verification state        | `is_verified=true`                                                   | Account is verified and can create sessions through sign-in/OAuth.                               |
| User soft-delete state         | `is_deleted=false`                                                   | Active account; email uniqueness endpoint blocks duplicates only for verified, non-deleted users. |
| User origin                    | `self_registered` / `admin_created`                                  | See `USER_ORIGIN_TYPES` in `@repo/constants`.                                                    |
| Site context                   | `main`                                                               | Main app portal; admin users are blocked from signing in here.                                   |
| Site context                   | `admin`                                                              | Admin portal; non-admin users are blocked from signing in here.                                  |
| Verification token row state   | `role` nullable                                                      | `role` is set for email verification; nullable for forgot-password token rows.                   |
| Session row state              | `revoked_at IS NULL` and `expires_at > now` and `rotated_to IS NULL` | Active session token in `app_user_refresh_tokens`.                                                |
| Session row state              | `rotated_to IS NOT NULL`                                             | Session rotated by sliding refresh; reuse indicates replay attempt and revokes entire family.     |
| Session row state              | `revoked_at IS NOT NULL`                                             | Explicitly revoked by sign-out, password reset, or security event.                               |

> **Note:** Auth uses boolean soft-delete (`is_deleted`) instead of `deleted_at`. Email uniqueness checks therefore branch on `is_verified && !is_deleted`.

## State Transition Diagram

```text
                                  (preflight only)
      ┌───────────────────────────────────────────────────────────┐
      │ POST /check-email-uniqueness — no persistence change      │
      └───────────────────────────────────────────────────────────┘

                POST /sign-up
  ┌───────────────────────────────────┐
  │ user: is_verified=false           │
  │ token row upserted (role-scoped)  │
  └───────────────┬───────────────────┘
                  │ POST /resend-email-verification-link
                  │ (token rotate, same user state)
                  ▼
  ┌───────────────────────────────────┐
  │ user: is_verified=false           │
  │ latest verification token active  │
  └───────────────┬───────────────────┘
                  │ POST /verify-email (valid token)
                  ▼
  ┌────────────────────────────────────────────────────────┐
  │ user: is_verified=true                                 │
  │ + create session + CSRF cookie                          │
  └───────────────┬────────────────────────────────────────┘
                  │ POST /sign-in or GET /google|/linkedin callback
                  ▼
         ┌─────────────────────────┐
         │ authenticated session   │
         │ (refresh-token family)  │
         └───────┬─────────┬───────┘
                 │         │
                 │         └─ GET /session-info (read-only)
                 │
                 ├─ POST /sign-out?allDevices=true  -> revoke user sessions
                 ├─ POST /sign-out                  -> revoke session family
                 │
                 └─ POST /reset-password            -> update password,
                                                      revoke all sessions,
                                                      clear session+csrf cookies

Forgot password branch:

verified user (or silent no-op for unknown email)
   │ POST /forgot-password
   ▼
reset token row upserted (role nullable)
   │ POST /validate-reset-password-link
   ▼
token validated (read-only)
   │ POST /reset-password
   ▼
password changed + token rows deleted + sessions revoked
```

## Transitions Reference

### `pre_auth` -> `pre_auth` (email uniqueness check)

| Field        | Value                                                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Endpoint     | `POST /api/auth/v1/check-email-uniqueness`                                                                            |
| Actor        | Public user                                                                                                           |
| Guard        | Email must be syntactically valid and normalized to lowercase. Checks whether a verified user already owns the email. |
| Effect       | No persistence mutation. Returns `data.isUnique=true` when signup can continue and `false` when unavailable.          |
| Side-effects | None.                                                                                                                 |

### `no_user_or_unverified_user` -> `pending_email_verification`

| Field        | Value                                                                                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Endpoint     | `POST /api/auth/v1/sign-up`                                                                                                                           |
| Actor        | Public user                                                                                                                                           |
| Guard        | Role must exist in DB and belong to `SELF_REGISTRABLE_ROLES`.                                                                                         |
| Effect       | Creates a user (or updates existing unverified user), assigns role, signs verification JWT, upserts one verification token row for `(user_id, role)`. |
| Side-effects | Sends verification email through Mailhog (development) or Nodemailer (production).                                                                    |

### `pending_email_verification` -> `pending_email_verification` (token rotation)

| Field        | Value                                                                |
| ------------ | ---------------------------------------------------------------------- |
| Endpoint     | `POST /api/auth/v1/resend-email-verification-link`                    |
| Actor        | Public user with unverified email                                     |
| Guard        | User must exist and be unverified.                                    |
| Effect       | Generates a fresh verification JWT and atomically replaces previous token row for that `(user_id, role)`. |
| Side-effects | Sends replacement verification email.                                 |

### `pending_email_verification` -> `verified_with_session`

| Field        | Value                                                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Endpoint     | `POST /api/auth/v1/verify-email`                                                                                                  |
| Actor        | Unverified user                                                                                                                   |
| Guard        | Token must decrypt, email and role must match user, token row must exist and be unexpired.                                       |
| Effect       | In one DB transaction: consume token row, set `app_users.is_verified=true`. Then creates session cookie + csrf cookie.             |
| Side-effects | Authenticates user immediately and returns allowed route set + redirect hint (`ROUTES.USER.WELCOME.href`).                       |

### `verified_without_session` -> `verified_with_session` (credential sign-in)

| Field        | Value                                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Endpoint     | `POST /api/auth/v1/sign-in`                                                                                                          |
| Actor        | Verified user                                                                                                                        |
| Guard        | Email exists, user verified, password hash matches, and request portal context (`main`/`admin`) matches permissions.                 |
| Effect       | Creates session token family row in `app_user_refresh_tokens`, sets HttpOnly session cookie and CSRF cookie, computes allowed routes. |
| Side-effects | Returns redirect URL based on site context (`ROUTES.USER.DASHBOARD.href` or `ROUTES.ADMIN.DASHBOARD.href`).                          |

### `verified_with_session` -> `verified_without_session` (single/family sign-out)

| Field        | Value                                                                                                                              |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Endpoint     | `POST /api/auth/v1/sign-out`                                                                                                       |
| Actor        | Authenticated user                                                                                                                 |
| Guard        | Requires session cookie and CSRF middleware pass.                                                                                  |
| Effect       | Revokes refresh-token family (`family_id`) by default, or all user sessions when `allDevices=true`; clears session + csrf cookies. |
| Side-effects | None beyond session invalidation and redirect hint `/`.                                                                            |

### `verified_with_session` -> `verified_with_session` (session introspection)

| Field        | Value                                                                                         |
| ------------ | --------------------------------------------------------------------------------------------- |
| Endpoint     | `GET /api/auth/v1/session-info`                                                               |
| Actor        | Authenticated user                                                                            |
| Guard        | `isAuthenticated()` must populate `res.locals.userId`; portal context must match permissions. |
| Effect       | Read-only fetch of user roles, permissions, and derived route list.                           |
| Side-effects | None.                                                                                         |

### `verified_without_session` -> `reset_token_issued`

| Field        | Value                                                                                                                                     |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Endpoint     | `POST /api/auth/v1/forgot-password`                                                                                                       |
| Actor        | Public user                                                                                                                               |
| Guard        | No hard failure for unknown email; only verified users receive token creation path.                                                       |
| Effect       | For verified users: signs reset JWT and upserts token row in `app_email_verification_tokens` with nullable `role`.                         |
| Side-effects | Sends reset email using admin or main base URL depending on user permission; always returns generic success message to avoid enumeration. |

### `reset_token_issued` -> `reset_token_validated`

| Field        | Value                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------- |
| Endpoint     | `POST /api/auth/v1/validate-reset-password-link`                                                   |
| Actor        | User with reset link                                                                               |
| Guard        | Token decrypts, token email matches payload email, user exists, token row exists and is unexpired. |
| Effect       | Read-only validation; no mutation.                                                                 |
| Side-effects | None.                                                                                              |

### `reset_token_validated` -> `password_reset_completed`

| Field        | Value                                                                                                                             |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Endpoint     | `POST /api/auth/v1/reset-password`                                                                                                |
| Actor        | User with valid reset token                                                                                                       |
| Guard        | Token decrypts and matches email, user exists, portal context check passes, token row valid, password schema constraints pass.    |
| Effect       | Updates `app_users.password`, revokes all active sessions for user, clears auth cookies, deletes verification token rows for user. |
| Side-effects | Forces global sign-out after password change.                                                                                     |

### `oauth_callback` -> `verified_with_session` (Google)

| Field        | Value                                                                                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Endpoint     | `GET /api/auth/v1/google`                                                                                                                             |
| Actor        | Browser redirected from Google OAuth                                                                                                                  |
| Guard        | `code`, `state`, saved cookies (`savedState`, `codeVerifier`) must be valid; optional `googleAuthToken` email must match provider email when present. |
| Effect       | Transactionally creates or updates user (`is_verified=true`), then creates session cookies.                                                          |
| Side-effects | Sends welcome email for first-time OAuth users and redirects to frontend.                                                                             |

### `oauth_callback` -> `verified_with_session` (LinkedIn)

| Field        | Value                                                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Endpoint     | `GET /api/auth/v1/linkedin`                                                                                                                        |
| Actor        | Browser redirected from LinkedIn OAuth                                                                                                             |
| Guard        | `code`, `state`, `savedState` must be valid; provider userinfo request must succeed; optional `linkedinAuthToken` email must match provider email. |
| Effect       | Transactionally creates or updates user (`is_verified=true`), then creates session cookies.                                                       |
| Side-effects | Sends welcome email for first-time OAuth users and redirects to frontend.                                                                          |

## Sub-flows

| Sub-flow                        | Branch Condition                                   | Runtime Behavior                                                                                                                |
| -------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Site-context gate               | `getSiteContext(req)` with admin permission check    | Main portal rejects admin users; admin portal rejects non-admin users; message is obfuscated in production for signin contexts. |
| Forgot-password base URL branch | User has `ADMIN.ADMINISTRATION_ACCESS` permission    | Reset email links target admin dashboard URL for admins; frontend URL for non-admin users.                                      |
| OAuth existing-user branch      | `existingUser.length === 0`                          | New users are inserted and receive a welcome email; existing users are marked verified.                                         |
| Allowed-routes branch           | User has `ADMIN.ADMINISTRATION_ACCESS` permission    | Admins get `getAllowedRoutes(ROUTES.ADMIN, ...)`; everyone else gets `getAllowedRoutes(ROUTES.USER, ...)`.                       |

## Token / Secret Lifecycle

| Artifact               | Produced In                                             | Stored In                                                              | Consumed In                                                  | Invalidated / Rotation                                                                                                 |
| ---------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Email verification JWT | `POST /sign-up`, `POST /resend-email-verification-link` | `app_email_verification_tokens.token` (with `role`)                     | `POST /verify-email`                                         | Replaced on resend; deleted on successful consumption.                                                                 |
| Forgot-password JWT    | `POST /forgot-password`                                 | `app_email_verification_tokens.token` (`role` nullable)                 | `POST /validate-reset-password-link`, `POST /reset-password` | Replaced on repeat requests; deleted on successful reset.                                                              |
| Session JWT            | `createSession()` during signin/verify-email/OAuth      | Client cookie (`SESSION_TOKEN_NAME`) + DB row `app_user_refresh_tokens` | `validateSession` middleware and protected endpoints         | Sliding rotation updates `rotated_to`; replay detection revokes full family; sign-out/reset-password revokes sessions. |
| CSRF cookie token      | `createSession()` via `setCsrfCookie()`                 | Client cookie (`CSRF_TOKEN_NAME`)                                      | `csrfProtection()` (e.g. sign-out)                           | Cleared on sign-out and password reset (`clearSessionCookies`).                                                        |
| OAuth anti-CSRF state  | OAuth initiation step (outside callback controller)     | Request cookies (`savedState`, plus `codeVerifier` for Google)         | OAuth callbacks (`/google`, `/linkedin`)                     | One-time checked in callback; flow aborts on mismatch/missing values.                                                  |

## Design Rationale

| Decision                                                       | Why It Exists                                                                          | Trade-off                                                                               |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Generic forgot-password success response for all emails        | Prevents user enumeration by not revealing whether an account exists.                  | Harder for users to know if they mistyped email; mitigated by UX copy.                    |
| Session family model with replay detection                     | Detects reused rotated tokens and revokes full family for security hardening.          | More DB writes and session-state complexity.                                              |
| Immediate session creation after successful email verification | Removes extra sign-in step after verification and improves onboarding completion rate. | Verification endpoint becomes state-changing auth endpoint and must be tightly guarded.   |
| Portal context enforcement (`main` vs `admin`)                 | Prevents cross-portal authentication misuse and keeps role-specific UX boundaries.     | Requires permission-aware checks in signin/session-info/reset paths.                      |
| Single self-registrable role (`user`)                          | Keeps the generic template's signup surface minimal; role-specific onboarding is a concern for whatever product is built on top. | Any product-specific signup branching (e.g. a second self-registrable role) must be added deliberately, not inherited. |

## DB Schema

### `app_users`

| Column          | Type           | Nullable | Purpose                                             |
| --------------- | -------------- | -------- | ---------------------------------------------------- |
| `id`            | `uuid`         | No       | User primary key.                                   |
| `email`         | `varchar(255)` | No       | Unique login identifier.                            |
| `password`      | `varchar(64)`  | No       | Password hash (empty string for OAuth-only users).  |
| `is_verified`   | `boolean`      | No       | Email/account verification gate for signin flows.   |
| `is_deleted`    | `boolean`      | No       | Soft-delete flag used by uniqueness checks.         |
| `provider_name` | `varchar(90)`  | No       | Origin provider (`email`, OAuth provider, etc.).    |
| `user_origin`   | `varchar(50)`  | No       | Account origin classification — see `USER_ORIGIN_TYPES` (`self_registered` / `admin_created`). |
| `invited_by`    | `uuid`         | Yes      | Admin user reference when `user_origin=admin_created`. |
| `username`      | `varchar(150)` | No       | Unique public/system username.                      |
| `profile_image` | `varchar(500)` | Yes      | Optional avatar URL.                                |
| `registered_at` | `timestamp`    | No       | Registration timestamp.                             |
| `created_at`    | `timestamp`    | No       | Row creation timestamp.                             |
| `updated_at`    | `timestamp`    | No       | Row update timestamp.                               |

### `app_email_verification_tokens`

| Column       | Type           | Nullable | Purpose                                                                |
| ------------ | -------------- | -------- | ------------------------------------------------------------------------ |
| `id`         | `uuid`         | No       | Token row primary key.                                                  |
| `user_id`    | `uuid`         | No       | Token owner (`app_users.id`).                                            |
| `token`      | `varchar(255)` | No       | Signed JWT used for email verify/reset flows.                           |
| `role`       | `varchar(50)`  | Yes      | Role-scoped verification context (`user`, etc.); nullable for reset-password. |
| `expires_at` | `timestamp`    | No       | Absolute token expiry for validation query.                             |
| `created_at` | `timestamp`    | No       | Row creation timestamp.                                                 |

### `app_user_refresh_tokens`

| Column        | Type                      | Nullable | Purpose                                            |
| ------------- | ------------------------- | -------- | ---------------------------------------------------- |
| `jti`         | `uuid`                    | No       | Session token identifier (primary key).            |
| `user_id`     | `uuid`                    | No       | Session owner (`app_users.id`).                     |
| `family_id`   | `uuid`                    | No       | Rotation family identifier for grouped revocation. |
| `rotated_to`  | `uuid`                    | Yes      | Next token JTI after sliding refresh.              |
| `revoked_at`  | `timestamp with timezone` | Yes      | Revocation marker for invalid sessions.            |
| `expires_at`  | `timestamp`               | No       | Session expiry timestamp.                          |
| `device_info` | `varchar(255)`            | No       | Serialized user-agent fingerprint data.            |
| `ip`          | `varchar(50)`             | No       | Session source IP.                                 |
| `created_at`  | `timestamp`               | No       | Session row creation timestamp.                    |
| `updated_at`  | `timestamp`               | No       | Session row update timestamp.                      |

### `app_user_roles`

| Column        | Type        | Nullable | Purpose                    |
| ------------- | ----------- | -------- | -------------------------- |
| `user_id`     | `uuid`      | No       | User-role association key. |
| `role_id`     | `integer`   | No       | Role id association key.   |
| `assigned_at` | `timestamp` | No       | Role assignment timestamp. |

### `app_activity_logs`

| Column           | Type           | Nullable | Purpose                               |
| ---------------- | -------------- | -------- | ---------------------------------------- |
| `id`             | `uuid`         | No       | Activity log primary key.               |
| `table_name`     | `varchar(100)` | No       | Changed table name.                     |
| `record_id`      | `varchar(255)` | No       | Changed record identifier.              |
| `operation_type` | `varchar(20)`  | No       | Operation kind (`CREATE`/`UPDATE`/etc). |
| `user_id`        | `uuid`         | No       | Actor user id.                          |
| `new_values`     | `jsonb`        | Yes      | Snapshot for created/updated values.    |
| `description`    | `text`         | Yes      | Human-readable activity text.           |
| `ip_address`     | `varchar(45)`  | Yes      | Request source IP.                      |
| `user_agent`     | `text`         | Yes      | Request user agent metadata.            |
| `created_at`     | `timestamp`    | No       | Log creation timestamp.                 |

## Error Catalogue

| Error                                                        | Trigger                                                                               | HTTP status | Thrown by                                                                                 |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------- |
| `validation` (`Invalid role`)                                | Signup role name not found in roles table.                                            | `422`       | `getRoleByTitle` (`domain/users/models/roles.queries.ts`)                                 |
| `bad_request` (`Something went wrong`)                       | Signup role is outside `SELF_REGISTRABLE_ROLES`.                                      | `400`       | `signupController`                                                                        |
| `conflict` (`This email is already in use. Want to log in?`) | Verified user already exists during signup.                                           | `409`       | `getOrCreateUserOnSignUp`                                                                 |
| `not_found` (`Email is not found in our system.`)            | User lookup misses during resend/verify/reset validation flows.                       | `404`       | `checkUserIsVerifiedOrNotService`                                                         |
| `conflict` (`Email is already verified. Please login.`)      | Resend/verify called for already-verified account.                                    | `409`       | `checkUserIsVerifiedOrNotService`                                                         |
| `conflict` (`Email is not verified.`)                        | Flow requires verified account but user is unverified.                                | `409`       | `checkUserIsVerifiedOrNotService`                                                         |
| `bad_request` (`Invalid or Expired Link Submitted.`)         | JWT decode fails for verify/reset token.                                              | `400`       | `decryptToken`                                                                            |
| `validation` (`Something went wrong`)                        | Verify/reset token row not found or expired in DB.                                    | `422`       | `checkTokenExistsOrExpiresService`                                                        |
| `bad_request` (`Something went wrong`)                       | Token email differs from request email in verify flow.                                | `400`       | `emailVerificationController`                                                             |
| `validation` (`Something went wrong`)                        | Token role not present in user roles during verify.                                   | `422`       | `emailVerificationController`                                                             |
| `validation` (`Something went wrong`)                        | Verification token consume step returns zero rows (already used/race).                | `422`       | `emailVerificationController` (transaction block)                                         |
| `bad_request` (`Email or password is incorrect.`)            | User missing, unverified, or password mismatch at signin.                             | `400`       | `signinController`                                                                        |
| `forbidden` (context-specific message)                       | User signs into wrong portal (`main` vs `admin`) for permission set.                  | `403`       | `validateSiteContextForUser`                                                              |
| `unauthorized` (`Unauthorized`)                              | Protected endpoint lacks `res.locals.userId`.                                         | `401`       | `getUserIdFromAuth`                                                                       |
| Direct response (`Already logged out`)                       | Sign-out called with no session cookie.                                               | `400`       | `signoutController` (non-throw path)                                                      |
| Direct response (`User not found`)                           | Session info cannot load user by authenticated id.                                    | `404`       | `sessionInfoController` (non-throw path)                                                  |
| `validation` / `bad_request` typed OAuth throws              | Missing/mismatched OAuth state, verifier, or token-email mismatch in OAuth callbacks. | `400`       | `googleSignIn`, `linkedinSignIn`                                                          |
| `internal_server_error` typed OAuth throws                   | LinkedIn/Google provider timeout or provider error response.                          | `500`       | `googleSignIn`, `linkedinSignIn`                                                          |

## Related Documents

| Document                                   | Path                                                                 |
| ------------------------------------------- | --------------------------------------------------------------------- |
| Auth Swagger index                         | `apps/backend/src/modules/auth/swagger-docs.ts`                      |
| Auth user lifecycle notes                  | `apps/backend/src/modules/auth/docs/user-lifecycle.md`               |
| Auth routes                                | `apps/backend/src/modules/auth/auth.routes.ts`                       |
