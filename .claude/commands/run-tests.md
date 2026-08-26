---
description: Detect the test runner (node:test, Playwright, Jest) from the file path and run the tests, returning a pass/fail summary.
allowed-tools:
  - Read
  - Bash
---

# Run Tests

## Step 1 — Resolve the target test file

Check if a test file is attached or mentioned in the current context.

- If a test file **is** provided → proceed to Step 2.
- If **no** test file is provided, respond with:

> Please attach or name the test file you want to run (e.g. drag it into chat, or type the path).

Do **not** guess a file path. Wait for the user to provide it.

---

## Step 2 — Detect the test runner

Determine the runner based on the file's location and content. Use these rules in order:

| Condition                                             | Runner              | Root directory     |
| ----------------------------------------------------- | ------------------- | ------------------ |
| File is inside `apps/e2e-backend/`                    | **Playwright**      | `apps/e2e-backend` |
| File is inside `apps/backend/` and ends in `.test.ts` | **node:test** (tsx) | `apps/backend`     |
| File is inside `apps/frontend/` or `apps/admin/`      | **Jest**            | that app's folder  |

If you cannot determine the runner from the path alone, look at the imports inside the file:

- `import { test, expect } from '@playwright/test'` → Playwright
- `import { describe, it } from 'node:test'` or `import assert from 'node:assert'` → node:test
- `import { describe, it, expect } from '@jest/globals'` or `jest.mock(...)` → Jest

State which runner you detected and why before running.

---

## Step 3 — Run the tests

Use Bash to run the appropriate command for the detected runner.

### node:test (apps/backend)

```bash
cd apps/backend
DATABASE_URL=postgresql://starteruser:StarterProdDB123@localhost:5432/starterdb \
REDIS_HOST=localhost \
tsx --test --test-force-exit <absolute-or-relative-path-to-file>
```

### Playwright (apps/e2e-backend)

```bash
cd apps/e2e-backend
npx playwright test <path-to-file> --reporter=list
```

### Jest (apps/frontend or apps/admin)

```bash
cd <app-root>
pnpm jest <path-to-file> --no-coverage
```

---

## Step 4 — Report results

After the run completes, return a structured summary:

```
Runner:   <node:test | Playwright | Jest>
File:     <path>

Results:
  ✓ Passed:  <count>
  ✗ Failed:  <count>
  ○ Skipped: <count>

<If any failures, list each one:>
FAILED: <test name>
  → <error message or assertion failure>
```

If the run itself fails to start (e.g. DB not reachable, missing env, compile error), report the error clearly and suggest a fix — do not silently retry.
