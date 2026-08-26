---
description: "Pointer map from backend code areas to the ADR(s) that govern them. Auto-injected for all backend source files."
applyTo: "apps/backend/src/**"
---

# Backend ADR Map

Before changing code in the areas below, read the linked ADR. ADRs encode decisions that override generic best-practice defaults.

| Code area                                                          | ADR file                                                                            | What it decides                                                              |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Session rotation, refresh tokens, auth cookies                     | `apps/backend/docs/adr/adr-001-session-rotation-grace-period.md`                    | Grace period for rotated session tokens; concurrent-request handling         |
| Any thrown error in controllers/services/middleware                | `apps/backend/docs/adr/adr-002-error-throwing-convention.md`                        | Use `createError` + throw; no manual `res.status().json({ error })` patterns |
| Policies and authorization (`*.policy.ts`, `authorize` middleware) | `apps/backend/docs/adr/adr-003-inline-policy-guards-over-checkpolicy-middleware.md` | Inline policy guards in controllers over a generic `checkPolicy` middleware  |
| Role/owner schema and uniqueness                                   | `apps/backend/docs/adr/adr-004-partial-unique-index-for-org-owner.md`               | Partial unique index expressing the "one owner per role" invariant           |
| Email/identity verification token resend flows                     | `apps/backend/docs/adr/adr-005-preserve-verification-token-context-on-resend.md`    | Preserve original token context on resend rather than minting fresh context  |
| Signup email availability checks                                   | `apps/backend/docs/adr/adr-006-controlled-signup-availability-checks.md`            | Public signup prechecks return only constrained boolean availability         |
| CSRF middleware, token issuance, and protected browser mutations    | `apps/backend/docs/adr/adr-007-csrf-origin-validation-and-token-rotation.md`        | Validate trusted origins and rotate CSRF cookies after successful validation |
| Storing any third-party provider secret in Postgres (OAuth refresh tokens, third-party sign-in credentials) | `apps/backend/docs/adr/adr-008-oauth-refresh-token-encryption-at-rest.md` | AES-256-GCM via `src/lib/token-encryption.utils.ts` with a dedicated `TOKEN_ENCRYPTION_KEY`; never reuse `JWT_SECRET`/`CSRF_SECRET`. **`src/lib/auth.utils.ts` `encrypt`/`decrypt` are JWT sign/verify, not encryption — do not use them for secrets.** Also records a partial unique index for third-party sign-in re-linking |

## How To Use This File

1. Identify the code area you are about to change.
2. Open the corresponding ADR before editing.
3. If your change conflicts with the ADR, **do not silently override it**:
   - Either align the change with the ADR, or
   - Stop and surface the conflict to the user; a new ADR may be required.

## Adding A New ADR

- Place new ADRs under `apps/backend/docs/adr/` using the next sequential number.
- Add a row to the table above in the same PR.
- Use the existing ADR files as a template (Context, Decision, Consequences, Alternatives).
