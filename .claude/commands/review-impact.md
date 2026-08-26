---
description: Analyse the impact of changes to a backend file — lists which tests and swagger docs are likely stale and need review.
allowed-tools:
  - Read
  - Bash
---

# Review Impact

## Step 1 — Resolve the changed file

Check if a modified backend file is attached or named in the context.

- If a file **is** provided → proceed to Step 2.
- If not, respond with:

> Please attach or paste the path of the file you modified (e.g. `apps/backend/src/modules/.../foo.service.ts`).

---

## Step 2 — Classify the file

Determine the file's role from its suffix:

| Suffix | Role |
| --- | --- |
| `.service.ts` | Business logic — has direct test counterpart, may affect swagger response shape |
| `.controller.ts` | Request handler — has direct test counterpart, affects swagger request/response |
| `.routes.ts` | Route registration — affects swagger path/method, no direct test file |
| `.queries.model.ts` | DB query — has direct test counterpart, no swagger impact |
| `.policy.ts` | Authorization — no direct test file, no swagger impact |

State the classification before continuing.

---

## Step 3 — Find the corresponding test file

For `.service.ts`, `.controller.ts`, and `.queries.model.ts` files:

1. Derive the expected test filename: replace `.ts` with `.test.ts` (same directory).
   - Example: `revoke-api-key.service.ts` → `revoke-api-key.service.test.ts`
2. Check if that file exists.
3. If it **exists**: read it and identify which test cases cover the logic that changed. List them.
4. If it **does not exist**: note "No test file found — tests not yet written."

---

## Step 4 — Find the corresponding swagger docs

For `.service.ts`, `.controller.ts`, and `.routes.ts` files:

1. Identify the module directory (go up from the file to find the nearest `swagger-docs/` folder).
2. List all `*.swagger.ts` files in that `swagger-docs/` folder.
3. Read any swagger file whose endpoint name matches the changed file's action name.
   - Example: `revoke-api-key.service.ts` → look for `revoke-*.swagger.ts`
4. Check if the response schema in that swagger file still matches what the service returns.

---

## Step 5 — Report findings

Respond with this exact structure:

```
## Impact Report: <filename>

### Classification
<file role>

---

### Tests
Status: <EXISTS | NOT WRITTEN YET>
File: <path or "—">

<If exists, list which test cases cover changed logic:>
- "<test case name>" — covers <what>
  → <LIKELY STALE | LOOKS OK | NEEDS VERIFICATION>

<If stale tests found, describe what specifically needs updating.>

---

### Swagger Docs
Status: <EXISTS | NOT FOUND>
File(s): <path(s) or "—">

<For each swagger file found:>
- <endpoint> — <LIKELY STALE | LOOKS OK | NEEDS VERIFICATION>
  → <reason: e.g. "response shape changed", "new field added", "error code changed">

---

### Recommended Actions
1. <specific action>
2. <specific action>
...
```

If the changed file has no test or swagger impact (e.g. a `.policy.ts`), say so explicitly and explain why.
