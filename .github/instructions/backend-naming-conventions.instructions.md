---
description: "Naming conventions for files, variables, functions, and constants in the backend Express/TypeScript codebase."
applyTo: "apps/backend/src/**"
---

# Backend Naming Conventions

## Scope (Backend Only)

This instruction applies only to the backend Express/TypeScript app under `apps/backend/src/**`.

Do not apply these backend-specific naming rules to:

- `apps/frontend/**`
- `apps/admin/**`
- `packages/**`
- non-backend tooling/docs unless explicitly stated

This document defines the naming conventions for this Node.js/Express/TypeScript backend codebase. All code reviews — including AI-assisted reviews — must validate that files and code conform to these rules.

---

## 1. File Naming

Use the **entity-first kebab-case** pattern: `{entity}-{action}.{role}.ts`.
The entity is always the anchor, followed by the optional action, then the role suffix.

| Pattern                       | Example                             | When to use                            |
| ----------------------------- | ----------------------------------- | -------------------------------------- |
| `{entity}.{role}.ts`          | `role.controller.ts`          | Main file for an entity (CRUD grouped) |
| `{entity}-{action}.{role}.ts` | `role-restore.controller.ts`   | Entity with a specific action          |
| `{compound-entity}.{role}.ts` | `email-verification-token.routes.ts` | Multi-word entity                      |
| `{entity}.{role}.ts`          | `permission.swagger.ts`             | Docs, types, utils                     |

**Available role suffixes:** `.controller` · `.service` · `.routes` · `.middleware` · `.swagger` · `.schema` · `.types` · `.utils` · `.model` · `.template` · `.queue` · `.policy`

**Rules:**

- Never use action-first (`create-email-verification-token.controller.ts`) for controllers/services
- Never include articles (`an`, `all`, `the`) in file names
- Never use PascalCase or camelCase for file names (`authUtils.ts` ❌ → `auth.utils.ts` ✓)

**Directories:** Use `kebab-case`. Example: `user-management/`, `swagger-docs/`

**Configuration files:** Use `kebab-case` or `snake_case`. Example: `drizzle.config.ts`, `env_variables.env`

**Database schema files:** Use `snake_case` to match DB column conventions. Example: `app_email_verification_tokens.ts`

**Test files:** Mirror the source file name with `.test.ts` or `.spec.ts`. Example: `email-verification-token-resend.controller.test.ts`

---

## 2. Variable Naming

**Rule: `camelCase` for all variables.**

```ts
// ✓ Good
const userId = req.params.userId;
const eligibleRoles = resourceData.filter(...);
const trimmedEmail = email.trim().toLowerCase();
const newExpiresAt = new Date();

// ✗ Bad
const user_id = ...;      // snake_case
const UserId = ...;       // PascalCase
const u = ...;             // single-letter (except loop counters)
const userid = ...;       // no camelCase separation
```

**Arrays must use plural names:**

```ts
// ✓ Good
const eligibleIds: string[] = [];
const duplicateEmails: string[] = [];
const ownerEmails: string[] = [];

// ✗ Bad
const eligibleId: string[] = []; // singular for an array
const ownerEmail: string[] = []; // singular for an array
```

**Boolean variables use `is`, `has`, `can`, `should` prefix:**

```ts
// ✓ Good
const isEligibleToTakeAction = true;
const hasPermission = false;
const isDeleted = record.deletedAt !== null;

// ✗ Bad
const eligible = true;
const permissionCheck = false;
const deleted = true;
```

**Avoid abbreviations** — always use the full descriptive name:

```ts
// ✓ Good
const userId = ...;
const passwordResetExpiryDays = ...;
const userAgent = ...;

// ✗ Bad
const uId = ...;
const resetExpDays = ...;
const ua = ...;
```

---

## 3. Function Naming

**Rule: `camelCase`, starting with a verb that describes the action.**

### Controllers

Pattern: `{verb}{Entity}Controller`

```ts
// ✓ Good
export const getEmailVerificationTokensController = asyncHandler(...)
export const createEmailVerificationTokenController = asyncHandler(...)
export const cancelEmailVerificationTokenController = asyncHandler(...)
export const resendEmailVerificationTokenController = asyncHandler(...)
export const removeEmailVerificationTokenController = asyncHandler(...)
export const verifyEmailVerificationTokenController = asyncHandler(...)

// ✗ Bad
export const sendUserEmailVerificationController = ...  // not verb-first on entity
export const cancelEmailVerificationTokenStatusController = ...    // redundant "Status"
export const verifyEmailVerificationTokenForUserController = ...  // overly verbose
```

### Services

Pattern: `{verb}{Entity}Service`

```ts
// ✓ Good
export const createEmailVerificationTokenService = async (...) => { ... }
export const getEmailVerificationTokensService = async (...) => { ... }
export const resendEmailVerificationTokenService = async (...) => { ... }
export const cancelEmailVerificationTokenService = async (...) => { ... }
export const removeEmailVerificationTokenService = async (...) => { ... }
export const verifyEmailVerificationTokenService = async (...) => { ... }

// ✗ Bad
export const emailVerificationTokenService = ...           // no verb
export const handleEmailVerificationTokens = ...           // vague verb "handle"
export const processEmailVerificationRequest = ...    // "process" + "Request" is noisy
```

### Utility / Helper functions

Pattern: `{verb}{Noun}` — no role suffix needed

```ts
// ✓ Good
export const getUserIdFromAuth = (res) => { ... }
export const buildEmailTemplate = (data) => { ... }
export const validateIncomingRequests = (...) => { ... }
export const logActivity = (payload) => { ... }
export const asyncHandler = (fn) => { ... }

// ✗ Bad
export const logCreateActivity = ...   // "Create" implies DB insert; misleading for update logs
export const helper = ...              // meaningless name
```

### Query / Model functions

Pattern: `{verb}{Entity}` — reads like plain English

```ts
// ✓ Good
export const getRoleMembers = (...)
export const getRoleOwnerEmail = (...)
export const rolesExist = (...)
export const rolePermissionsExist = (...)
```

**Approved verbs by use case:**

| Use case            | Approved verbs                                           |
| ------------------- | -------------------------------------------------------- |
| Fetching data       | `get`, `find`, `list`, `fetch`                           |
| Writing data        | `create`, `update`, `delete`, `remove`, `save`, `upsert` |
| Validation          | `validate`, `verify`, `check`, `assert`                  |
| Building/formatting | `build`, `format`, `parse`, `transform`, `map`           |
| Auth/security       | `encrypt`, `decrypt`, `authorize`, `authenticate`        |
| Logging             | `log`, `track`, `record`                                 |

> ❌ Avoid vague verbs: `handle`, `process`, `manage`, `do`

---

## 4. Constant Naming

**Rule: `SCREAMING_SNAKE_CASE` for all module-level constants and enums.**

```ts
// ✓ Good
const REMOVABLE_STATUSES = [...] as const;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MAX_RETRY_COUNT = 3;

// Used from shared packages:
EMAIL_VERIFICATION_TOKEN_STATUS.PENDING
PERMISSIONS.USER_MANAGEMENT.UPDATE_ROLES
ROLES.ADMIN

// ✗ Bad
const removableStatuses = [...];   // camelCase for a constant
const emailregex = ...;            // no separation, no capitalization
```

**Local constants inside a function** that are not truly "fixed config" may use `camelCase`:

```ts
const now = new Date(); // ✓ local temporal value
const roleName = role[0]?.name; // ✓ local derived value
```

---

## 5. Type & Interface Naming

**Rule: `PascalCase` for all types, interfaces, and enums.**

```ts
// ✓ Good
type UpdateEmailVerificationTokenAction = "cancel" | "remove";
type ResolvedEmailVerificationToken = { userId: string | null; data: {...} };
type EmailVerificationTokenPayloadType = { email: string; ... };

export interface EmailVerificationTokenResponse {
  success: boolean;
  data: EmailVerificationToken;
}

// ✓ Enum
enum EmailVerificationTokenStatus {
  Pending = "pending",
  Verified = "verified",
  Cancelled = "cancelled",
}

// ✗ Bad
type updateEmailVerificationTokenAction = ...;  // camelCase
type email_verification_token_payload = ...;      // snake_case
interface emailVerificationTokenResponse {...}  // camelCase
```

**Type naming patterns by category:**

| Category         | Pattern                                    | Example                        |
| ---------------- | ------------------------------------------ | ------------------------------ |
| Payload / input  | `{Entity}Payload` or `{Entity}Input`       | `EmailVerificationTokenPayload`            |
| API response     | `{Entity}Response`                         | `EmailVerificationTokenResponse`           |
| Service params   | `{Verb}{Entity}Params`                     | `CreateEmailVerificationTokenParams`       |
| Zod inferred     | `{Entity}Schema` → infer as `{Entity}Type` | `SignUpType`            |
| Resource from DB | `{Entity}ResourceType`                     | `EmailVerificationTokenResourceType` |

> Avoid the `I` prefix for interfaces (`IEmailVerificationToken` ❌). Use plain `PascalCase`.

---

## 6. Class Naming

**Rule: `PascalCase` nouns. No `Manager`, `Handler`, `Helper` suffixes unless truly necessary.**

```ts
// ✓ Good
class EmailVerificationTokenQueue { ... }
class EmailService { ... }
class RolePolicy { ... }

// ✗ Bad
class emailVerificationTokenQueue { ... }   // camelCase
class EmailVerificationTokenManager { ... } // vague "Manager"
class EmailHelper { ... }       // vague "Helper"
```

---

## 7. Database / Schema Naming

- **Table names:** `snake_case`, prefixed with module abbreviation. Example: `app_email_verification_tokens`
- **Column names:** `snake_case`. Example: `role_id`, `deleted_at`, `expires_at`
- **Drizzle table variables:** `camelCase` with `Table` suffix. Example: `appRolesTable`, `appEmailVerificationTokensTable`
- **Query model exports:** verb-based functions. Example: `rolesExist`, `emailVerificationTokensExist`

---

## 8. Route & HTTP Naming

- Route paths use `kebab-case` and plural nouns for resource collections:
  ```
  /api/user-management/v1/roles
  /api/user-management/v1/roles/:roleId/permissions
  /api/auth/v1/email-verification-tokens
  ```
- Never use verbs in REST paths (`/getRoles` ❌, `/roles` ✓)
- Action sub-resources are acceptable: `/email-verification-tokens/resend`, `/email-verification-tokens/:id/cancel`

---

## 9. Environment Variables

**Rule: `SCREAMING_SNAKE_CASE`**

```
DATABASE_URL
EMAIL_FROM
FRONTEND_URL
EMAIL_VERIFICATION_TOKEN_AGE
```

---

## 10. Queue & Job Naming

- **Queue variables:** `camelCase` with `Queue` suffix. Example: `emailVerificationTokenQueue`
- **Job names:** `kebab-case` strings, scope-prefixed. Example: `"user-management-email-verification-email"`

---

## Quick Reference Cheat Sheet

| Thing                   | Convention                   | Example                           |
| ----------------------- | ---------------------------- | --------------------------------- |
| File                    | `entity-action.role.ts`      | `email-verification-token-resend.controller.ts` |
| Directory               | `kebab-case`                 | `swagger-docs/`                   |
| Variable                | `camelCase`                  | `eligibleRoles`             |
| Boolean variable        | `is/has/can` prefix          | `isEligibleToTakeAction`          |
| Array variable          | plural                       | `eligibleIds`                     |
| Function                | `camelCase`, verb-first      | `createEmailVerificationTokenService`         |
| Controller export       | `{verb}{Entity}Controller`   | `resendEmailVerificationTokenController`     |
| Service export          | `{verb}{Entity}Service`      | `resendEmailVerificationTokenService`        |
| Constant (module-level) | `SCREAMING_SNAKE_CASE`       | `REMOVABLE_STATUSES`              |
| Type / Interface        | `PascalCase`                 | `ResolvedEmailVerificationToken`              |
| Class                   | `PascalCase`                 | `EmailVerificationTokenQueue`                 |
| DB table variable       | `camelCase` + `Table` suffix | `appRolesTable`            |
| Env variable            | `SCREAMING_SNAKE_CASE`       | `FRONTEND_URL`                    |
| Queue job name          | `kebab-case` string          | `"user-management-email-verification-email"`       |
