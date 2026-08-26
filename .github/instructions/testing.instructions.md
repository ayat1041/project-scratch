---
applyTo: "{apps/backend,apps/e2e-backend}/**/*.test.ts"
---

# Testing Standards — Monorepo

These instructions apply to all `*.test.ts` files across the monorepo. Follow them exactly when writing or reviewing tests for any feature.

---

## 0. Consult Design Documents Before Writing Tests

> **Use the [`generate-tests` prompt](./../prompts/generate-tests.prompt.md) when generating tests for a service or controller.** It enforces that the issue ticket and TDD are in context before any code is written.

**Before writing any test for a feature, read the issue ticket and its linked TDD sections.**

Each issue ticket references specific TDD sections. Extract the following before starting:

| TDD Section                                 | What to extract for tests                                                                                              |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Section 5** — Domain Model & State Design | All validation categories, all invalid state transitions, all invariants (e.g. "only one active invite per email") |
| **Section 7** — API Design                  | Request shape, response shape (including pagination fields, aggregate counts), all error codes                         |
| **Section 8** — Validation, Auth, Security  | The full set of validation categories for batch operations, permission names, security requirements                    |
| **Section 10** — Error Handling             | Per-item skip behavior in bulk operations, queue-failure recovery path, all error model categories                     |
| **Section 12** — Testing Strategy           | The TDD's own test checklist — use it as a cross-check after writing tests                                             |

### Validation categories for batch create operations

When a feature uses batch/bulk create, the service collects and returns ALL validation failure categories in one response. Write a service test for **each category**:

| Category                | What to seed / trigger                                    | Assert                                                                |
| ----------------------- | --------------------------------------------------------- | --------------------------------------------------------------------- |
| `invalidFormat`         | Pass malformed email strings                              | `code = FEATURE_VALIDATION_FAILED`, `details.invalidFormat` populated |
| `duplicateEmails`       | Pass same email twice (different case)                    | `details.duplicateEmails` populated                                   |
| `alreadyInvited`        | Insert an active row in DB for that email                 | `details.alreadyInvited` populated                                    |
| `alreadyRegistered`     | Insert an active `app_users` row for that email            | `details.alreadyRegistered` populated                                 |
| `protectedAdminEmails`  | Use an existing `SUPER_ADMIN`/`ADMIN` account email        | `details.protectedAdminEmails` populated                              |

### State machine coverage rule

For every invalid transition, write one service test. For every valid transition, write one service test that also **asserts the DB field was updated** (status, tokenVersion, etc.).

Invalid transitions to always cover:

- Cancel: only `invited` → `cancelled` is valid; `queued`, `expired`, `declined`, `sending_failed`, `cancelled` must all throw
- Resend: only from `invited|expired|declined|sending_failed|cancelled`; `queued` must throw
- Remove: only `declined|sending_failed|cancelled`; `queued`, `invited`, `expired` must throw

### 403 cross-privilege coverage rule

For **every mutation endpoint** (POST/PATCH/DELETE), write one E2E test where an authenticated `USER`-role account attempts the admin-only action:

```typescript
// A USER-role account tries to manage invitations (ADMIN-only action)
const res = await helper.mutateResource(invitationId, userCookies);
expect(res.status).toBeGreaterThanOrEqual(403);
expect(res.status).toBeLessThan(500);
expect(res.body.success).toBe(false);
```

This is **separate from** the 401 unauthenticated test. Both must exist.

---

## 1. Three-Layer Test Architecture

Every backend feature must have tests at exactly these three layers. Do not skip a layer. Do not test the same concern at multiple layers.

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: Unit Tests         *.utils.test.ts            │
│  Pure functions, state machines, zero I/O               │
├─────────────────────────────────────────────────────────┤
│  Layer 2: Component Tests    *.service.test.ts          │
│  Services + real DB + real Redis. No HTTP.              │
├─────────────────────────────────────────────────────────┤
│  Layer 3: API E2E Tests      apps/e2e-backend/      │
│  Full HTTP stack via Playwright. No mocks.              │
└─────────────────────────────────────────────────────────┘
```

**Core principle: test at the lowest layer that can catch the bug.**

| Concern                                               | Layer               |
| ----------------------------------------------------- | ------------------- |
| State machine rules, pure validation logic            | Unit                |
| DB constraint enforcement                             | Component           |
| Queue enqueue call count / failure fallback           | Component           |
| HTTP status code mapping                              | E2E                 |
| Auth guard (401/403)                                  | E2E                 |
| Zod request validation (400/422)                      | E2E                 |
| Response shape / field presence                       | E2E (contract test) |
| Cross-tenant isolation                                | E2E                 |
| Full user journey (create → resend → cancel → remove) | E2E                 |

---

## 2. When to Write Each Layer

Align test writing with the issue/PR that introduces the code being tested:

| After issue / PR delivers...                | Write these tests                                                       |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| Schema + migrations (Issue 1)               | Nothing yet — no business logic exists                                  |
| Domain queries + existence checks (Issue 2) | Unit tests for any extracted sort/filter helpers                        |
| Services + utils (Issue 3)                  | **Unit tests** (utils) + **Component tests** (services)                 |
| Routes + controllers (Issue 4)              | **API E2E tests** + **Contract tests**                                  |
| Worker implementation (Issue 5)             | Component test additions for queue-failure paths if not already covered |

Do not write E2E tests before routes exist. Do not write service tests before services exist.

---

## 3. Layer 1 — Unit Tests

### Runner

`node:test` + `tsx`. No test framework imports needed beyond `node:test`.

### File placement

Co-located with the source file:

```
src/modules/<feature>/services/invitation-lifecycle.utils.ts
src/modules/<feature>/services/invitation-lifecycle.utils.test.ts
```

### What belongs here

- Pure functions with no I/O
- State machine transition guards (`canResend`, `canCancel`, `canRemove`)
- Validation aggregation helpers (format check, duplicate detection)
- Token rotation logic
- Status-priority sorting helpers

### What does NOT belong here

- Anything that touches a database, Redis, queue, or HTTP
- Service functions — those go in component tests

### Pattern

```typescript
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { myPureFunction } from "./my-utils.js";

describe("myPureFunction", () => {
  it("returns X when given Y", () => {
    assert.equal(myPureFunction("Y"), "X");
  });
});
```

### Run command (from `apps/backend`)

```bash
DATABASE_URL=... REDIS_URL=... find src -name '*.utils.test.ts' | xargs tsx --test --test-force-exit
```

---

## 4. Layer 2 — Component Tests (Service Tests)

### Runner

`node:test` + `tsx`. Uses **real PostgreSQL** and **real Redis** — no mocks for infrastructure.

### File placement

Co-located with the service:

```
src/modules/<feature>/services/create-user-invitations.service.ts
src/modules/<feature>/services/create-user-invitations.service.test.ts
```

### Required setup pattern

```typescript
import { before, after, describe, it } from "node:test";
import { db } from "@/db/index.js";

// Seed required parent records in before(), clean up in after()
// Use uid() for every unique field to avoid cross-test contamination
const uid = () => Math.random().toString(36).slice(2, 10);

describe("createUserInvitationsService", () => {
  let adminUserId: string;

  before(async () => {
    // Insert the inviting admin user (or reverse per FK order)
    // Store ids in outer scope for all tests to share
  });

  after(async () => {
    // Delete in reverse FK order: child tables first
    // Example: invitation_events → user_invitations → activity_logs → user
  });
});
```

### Uniqueness rule

**Every unique DB field (email, tokenHash, etc.) must use `uid()` or `Date.now()` to prevent unique-constraint violations across test runs.**

```typescript
// CORRECT
const email = `test-${uid()}@example.com`;
const tokenHash = `hash-${uid()}`;

// WRONG — will collide on second run
const email = "fixed@example.com";
```

### What belongs here

- Service function called with valid inputs → assert DB state change **including specific field values** (status, tokenVersion, etc.)
- Service function called with invalid state → assert correct error code returned
- `enqueueFn` tracking (pass a spy to verify it was called N times)
- `enqueueFn` failure fallback (throw from enqueue → assert rows move to `sending_failed`)
- DB constraint enforcement (unique index, FK integrity)
- Bulk operations (3+ rows in one call)
- Hard delete verification: after remove, query DB and assert `rows.length === 0`
- Token rotation: after resend/cancel, query DB and assert `tokenVersion` incremented
- **All 5 validation categories for batch create** (one test each): `invalidFormat`, `duplicateEmails`, `alreadyInvited`, `alreadyRegistered`, `protectedAdminEmails` — seed appropriate DB state to trigger each one

### What does NOT belong here

- HTTP status codes — those are E2E concerns
- Auth middleware — that's E2E
- Zod schema validation of HTTP inputs — that's E2E
- Integration-layer tests that mock services — do not create this layer at all

### enqueueFn pattern

```typescript
// Spy that tracks calls
const calls: unknown[] = [];
const enqueueFn = async (payload: unknown) => {
  calls.push(payload);
};

// Failure spy
const failingEnqueue = async () => {
  throw new Error("Redis down");
};

it("tracks enqueue calls", async () => {
  await createService({ emails: [email1, email2] }, enqueueFn);
  assert.equal(calls.length, 2);
});

it("moves rows to sending_failed when enqueue throws", async () => {
  await createService({ emails: [email] }, failingEnqueue);
  // Query DB and assert status = "sending_failed"
});
```

### Run command (from `apps/backend`)

```bash
DATABASE_URL=postgresql://starteruser:StarterProdDB123@localhost:5432/starterdb \
REDIS_HOST=localhost \
REDIS_URL=redis://default:starterRedis123@localhost:6379 \
find src -name '*.service.test.ts' ! -path '*/__integration__/*' | xargs tsx --test --test-force-exit
```

### Integration tests

**Do not create an `__integration__` directory.** Integration tests that only test route wiring and status code mapping are fully superseded by E2E tests. If you find integration tests, remove them.

---

## 5. Layer 3 — API E2E Tests

### Runner

Playwright (`@playwright/test`) in `apps/e2e-backend`. Targets `http://localhost:8000`.

### File placement

One file per endpoint, under a module/feature folder:

```
apps/e2e-backend/tests/modules/user-management/user-invitations/
  list-invitations.test.ts
  create-invitations.test.ts
  resend-invitations.test.ts
  cancel-invitation.test.ts
  remove-invitations.test.ts
  invitation-lifecycle.test.ts   ← full journey + cross-privilege
```

**Do not put all endpoints in one file.** Split by endpoint.

### File naming convention

`<verb>-<resource>.test.ts` — matches the HTTP method + resource name.

### Required boilerplate (every E2E test file)

```typescript
import { test, expect } from "../../../fixtures/test-fixtures";
import {
  AuthHelperV2,
  generateSignUpDataV2,
} from "../../../utils/auth-v2-helpers";
import { ApiClient } from "../../../utils/api-client";
// Import the feature-specific helper:
import { UserInvitationHelper } from "../../../utils/invitation-helpers";

const BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8000";

test.describe("<Endpoint Name>", () => {
  let authHelper: AuthHelperV2;
  let featureHelper: UserInvitationHelper; // replace with relevant helper

  test.beforeEach(async ({ request }) => {
    authHelper = new AuthHelperV2(request, BASE_URL);
    featureHelper = new UserInvitationHelper(request, BASE_URL);
  });

  async function createAuthenticatedAdmin() {
    const signUpData = generateSignUpDataV2({ role: "admin" });
    const signUpResponse = await authHelper.signUp(signUpData);
    expect(signUpResponse.status).toBe(200);

    const verificationLink = authHelper.extractVerificationLink(signUpResponse);
    const tokenData = authHelper.extractTokenFromLink(verificationLink!);
    const verifyResponse = await authHelper.verifyEmail(tokenData!);
    expect(verifyResponse.status).toBe(200);

    const signInResponse = await authHelper.signIn({
      email: signUpData.email,
      password: signUpData.password,
    });
    expect(signInResponse.status).toBe(200);

    const cookies = ApiClient.formatCookies(
      ApiClient.extractCookies(signInResponse),
    );
    const userId: string | undefined = signInResponse.body?.data?.userInfo?.id;
    const role: string | undefined = signInResponse.body?.data?.userInfo?.role;

    return { cookies, userId, role, email: signUpData.email };
  }
});
```

### Skipping when the account is not ADMIN

Always guard admin-only tests with `test.skip`:

```typescript
const { cookies, role } = await createAuthenticatedAdmin();
test.skip(role !== "ADMIN", "Could not resolve ADMIN role");
```

### Describe block structure (required)

Every endpoint file must use nested `test.describe` blocks:

```
test.describe("<HTTP METHOD> /<path>", () => {
  test.describe("Valid Cases", () => { ... });
  test.describe("Input Validation Cases", () => { ... });
  test.describe("Business Rule Cases", () => { ... });  // if applicable
  test.describe("Invalid State Cases", () => { ... });  // if state machine
  test.describe("Security Cases", () => { ... });       // for mutation endpoints
  test.describe("Auth Cases", () => { ... });
});
```

### Mandatory coverage checklist per endpoint

**GET (list/read)**

- [ ] 200 with expected shape for authenticated user
- [ ] 200 empty state for fresh resource
- [ ] 200 new record appears after creation
- [ ] 401 unauthenticated
- [ ] 403 when a USER-role account attempts this admin-only action (separate from 401)
- [ ] Status filter (`?status=<value>`) returns only rows matching that status
- [ ] Invalid status enum value → 400/422, not 500
- [ ] Response includes aggregate counts field (e.g. `countsByStatus`) when TDD specifies it
- [ ] Response includes pagination fields (`limit`, `offset`, `total`) when TDD specifies them

**POST (create/mutate)**

- [ ] 201/200 single valid input
- [ ] 201/200 bulk input (3+ items)
- [ ] Response fields: `success`, `message`, `data.<ids>`
- [ ] No internal fields leak (no `tokenHash`, `passwordHash`, etc.)
- [ ] Returned IDs are valid UUIDs
- [ ] 400 empty array / missing required field / wrong type
- [ ] 422 invalid format with error code
- [ ] 422 duplicate input in same request
- [ ] 422 business rule violation (e.g. already exists in active state)
- [ ] 422 `alreadyRegistered` (email already belongs to a user) when applicable
- [ ] 422 `protectedAdminEmails` (existing SUPER_ADMIN/ADMIN email) when applicable
- [ ] 422 response body includes all failing categories in one pass (`details.errors.<category>`)
- [ ] XSS payload → 4xx, not 500
- [ ] SQL injection payload → 4xx, not 500
- [ ] Raw input not reflected verbatim in error body
- [ ] 401 unauthenticated
- [ ] 403 when a USER-role account attempts this admin-only action

**PATCH/PUT (single update)**

- [ ] 200 valid transition with ID in response
- [ ] 409 invalid state transition (wrong current state) with error code
- [ ] 404 or 409 non-existent ID
- [ ] 401 unauthenticated
- [ ] 403 when a USER-role account attempts this admin-only action

**DELETE (remove)**

- [ ] 200 eligible records removed, IDs in response
- [ ] 200 bulk removal
- [ ] Record no longer appears in list after removal
- [ ] 409 ineligible record
- [ ] 409 mixed eligible + ineligible in same request
- [ ] 400 empty array / missing field
- [ ] 401 unauthenticated
- [ ] 403 when a USER-role account attempts this admin-only action

### Lifecycle test file

Every feature must have a `<feature>-lifecycle.test.ts` that:

- Walks the full happy-path chain (create → resend → cancel → remove or equivalent)
- Tests cross-privilege isolation (a USER-role account cannot manage invitations — expect non-200)

### Security test expectations

```typescript
// XSS / SQL injection: must not 500
expect(res.status).toBeGreaterThanOrEqual(400);
expect(res.status).toBeLessThan(500);

// No raw script tag reflection in body
expect(JSON.stringify(res.body)).not.toContain("<script>");
```

### Error body shape expectations

```typescript
// All error responses must have success: false
expect(res.body.success).toBe(false);

// Business rule errors should have a machine-readable code
expect((res.body.details as { code?: string })?.code).toBe(
  "FEATURE_SPECIFIC_ERROR_CODE",
);
```

### Run command (from `apps/e2e-backend`)

```bash
npx playwright test tests/modules/<module>/<feature>/ --project=<project-name>
```

### Playwright config — adding a new project

When adding tests for a new module, add a project entry to `playwright.config.ts`:

```typescript
{
  name: "<module>-<feature>-tests",
  testMatch: "tests/modules/<module>/**/*.test.ts",
  use: { baseURL: process.env.API_BASE_URL ?? "http://localhost:8000" },
}
```

---

## 6. Contract Tests

Create a `<feature>.contract.test.ts` file alongside the E2E tests when:

- The frontend has a strict dependency on the response shape
- The feature has multiple status values that could silently degrade (e.g. `unknown` fallback)

Contract tests define TypeScript interfaces matching the frontend consumer contract and assert every response field and every enum value:

```typescript
interface RowContract {
  id: string;
  email: string;
  status:
    | "queued"
    | "invited"
    | "cancelled"
    | "sending_failed"
    | "expired"
    | "declined"
    | "accepted";
  createdAt: string;
  expiresAt: string;
}

function assertRowShape(row: unknown): asserts row is RowContract {
  const r = row as RowContract;
  expect(typeof r.id).toBe("string");
  expect(typeof r.email).toBe("string");
  expect([
    "queued",
    "invited",
    "cancelled",
    "sending_failed",
    "expired",
    "declined",
    "accepted",
  ]).toContain(r.status);
}
```

Contract tests live in the same folder as E2E tests and follow the same `createAuthenticatedAdmin` setup pattern.

---

## 7. Helper Classes (api-e2e-testing)

For each new feature module, create a helper class in `apps/e2e-backend/tests/utils/`:

```typescript
// <feature>-helpers.ts
export class UserInvitationHelper {
  private client: ApiClient;

  constructor(request: APIRequestContext, baseURL: string) {
    this.client = new ApiClient(request, baseURL);
  }

  async listInvitations(cookies?: string) { ... }
  async createInvitations(data: { emails: string[] }, cookies?: string) { ... }
  async resendInvitations(data: { ids: string[] }, cookies?: string) { ... }
  async cancelInvitation(invitationId: string, cookies?: string) { ... }
  async removeInvitations(data: { ids: string[] }, cookies?: string) { ... }
}
```

Pattern: constructor takes `(request: APIRequestContext, baseURL: string)`, uses `ApiClient` internally, all methods accept optional `cookies` (unauthenticated when omitted).

If a DELETE endpoint requires a request body, ensure `ApiClient.delete()` supports a `data` option.

---

## 8. Uniqueness in Tests

### Service tests (node:test)

Use an inline `uid()` helper:

```typescript
const uid = () => Math.random().toString(36).slice(2, 10);
const email = `svc-test-${uid()}@example.com`;
const tokenHash = `hash-${uid()}`;
```

### E2E tests (Playwright)

Use `Date.now()` + random suffix:

```typescript
const uniqueEmail = () =>
  `e2e-test-${Date.now()}-${Math.floor(Math.random() * 9999)}@starter.test`;
```

---

## 9. What NOT to Test

| Do not test                               | Reason                                             |
| ----------------------------------------- | -------------------------------------------------- |
| ORM internals (Drizzle query builder)     | Not your code                                      |
| Express framework routing                 | Not your code                                      |
| That a function was defined               | Trivial                                            |
| That TypeScript compiles                  | Handled by `pnpm check-types`                      |
| HTTP status codes in service tests        | Wrong layer — test in E2E                          |
| Auth middleware behavior in service tests | Wrong layer — test in E2E                          |
| Internal queue job structure              | Test the observable outcome, not the payload shape |

---

## 10. Error Code Conventions

Backend services must return machine-readable error codes that E2E tests can assert:

```
<FEATURE>_<ACTION>_<REASON>

Examples:
  INVITATION_VALIDATION_FAILED
  INVITATION_RESEND_INVALID_STATE
  INVITATION_CANCEL_INVALID_STATE
  INVITATION_REMOVE_INVALID_STATE
```

Error codes live in `res.body.details.code`. Always assert both the HTTP status and the code:

```typescript
expect(res.status).toBe(409);
expect((res.body.details as { code?: string })?.code).toBe(
  "INVITATION_CANCEL_INVALID_STATE",
);
```

---

## 11. Validation Checklist Before Finalizing Tests

- [ ] `pnpm --filter backend build` passes (catches TypeScript errors)
- [ ] `pnpm --filter backend lint` passes
- [ ] All test files have no TypeScript errors (`get_errors` tool)
- [ ] Service tests run and pass with real DB/Redis
- [ ] E2E test file structure matches the split-by-endpoint convention
- [ ] No hardcoded emails, UUIDs, or tokens that would collide across runs
- [ ] No `__integration__` directories introduced
- [ ] Auth cases exist in every E2E endpoint file
- [ ] Lifecycle test covers the full state chain for the feature
