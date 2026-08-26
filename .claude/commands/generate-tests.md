---
description: Generate traceable tests for a service/controller from the FRD→TDD→issue chain. Enforces that the FRD acceptance criteria, issue ticket, and TDD sections are in context, and emits AC-X markers + banded F<feat>-TC-NNNN ids so the FR→AC→TC chain stays verifiable.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
---

# Generate Tests (traceable, FRD-gated)

This command produces tests that **close the traceability loop** of the spec-driven flow:

```
FRD (FR-N "Verified By → AC-M";  AC-M "Validated By (Layer)")
  → TDD (design sections)
  → Issue (per-slice FR/AC table + DoD: "test file headers carry AC-X markers")
  → THIS COMMAND → tests with AC-X markers, routed to the correct layer
  → implementation-traceability-bridge.md "Testing Coverage Mapping" (real file names)
  → /spec-sync + scripts/check-spec-drift.ts (AC-traceability invariant) close the loop
```

The output is not "some tests for this file" — it is **the set of tests that satisfy the acceptance criteria the slice owns**, each marked with the `AC-N` it discharges and a banded `F<feat>-TC-NNNN` id.

## Test-case ID band scheme (shared convention)

Every test name is prefixed with a feature-scoped, **band-numbered** TC id: `F<feat>-TC-<NNNN>: <intent>`. Bands keep parallel authors (backend devs vs SQA) in disjoint number ranges so no two teams collide on the same id, and they encode the test layer directly in the number.

| Band   | Layer                                    | Owner        | Emitted here?                                        |
| ------ | ---------------------------------------- | ------------ | ---------------------------------------------------- |
| `0xxx` | Unit (pure logic)                        | Backend dev  | only if you author unit tests for branchy pure logic |
| `1xxx` | Integration (backend service + real DB)  | Backend dev  | **yes** — §13.1 backend ACs                          |
| `2xxx` | API E2E (backend, full middleware chain) | SQA          | **yes** — §13.3 cross-cutting ACs                    |
| `3xxx` | Frontend component / integration         | Frontend dev | no (out of scope)                                    |
| `4xxx` | Frontend / UI E2E                        | SQA          | no (out of scope)                                    |

**Sub-blocking within a band:** give each target file its own century block and leave gaps for inserts — e.g. api-keys integration: `revoke` → `1001…`, `create` → `1101…`, `rotate` → `1201…`, `delete` → `1301…`; the matching API E2E files take `2001…`, `2101…`, etc. The banded id lives in the **test name**; the `AC-N` marker stays in the **inline comment / file header**, so one AC can own many TCs across layers.

## Step 1 — Gate check (do this before anything else)

Verify the following are present in context. If **any are missing**, stop and ask the user before proceeding:

| Required artifact           | How to check                                                                                                                  | Why it is required                                                              |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **FRD acceptance criteria** | The feature's `*-frd.md` (or its §7 FR table + §13 AC tables). Look for the `Verified By` and `Validated By (Layer)` columns. | The FRD is the **owner** of the FR→AC contract. Tests assert ACs, not opinions. |
| **Issue ticket**            | The slice/issue (e.g. "Issue 3", "Issue 4") with its FR/AC traceability table.                                                | Tells you **which ACs this slice owns** — the exact coverage scope.             |
| **TDD sections**            | The TDD sections the issue links (domain model, state machine, validation, error codes, API design).                          | Tells you **how** each AC behaves so assertions are concrete.                   |
| **Target file**             | The service `.ts` or route/controller `.ts` to generate tests for.                                                            | Anchors the layer (service → integration; route → API E2E).                     |

If anything is missing, respond with exactly:

> Before I generate traceable tests, I need the following context:
>
> - [ ] **FRD** — the feature's FRD (or its §7 FR table + §13 AC tables with the `Verified By` / `Validated By (Layer)` columns)
> - [ ] **Issue ticket** — the slice that lists which FRs/ACs it owns
> - [ ] **TDD sections** — the TDD sections that issue links
> - [ ] **Target file** — confirm which service/route/controller file to test
>
> Please provide the missing items above and I'll proceed.

Do **not** infer or skip any of these. Do **not** generate partial tests.

---

## Step 2 — Build the AC coverage plan (the test contract)

Before writing a single test, build the coverage plan from the docs — this is the spine of the whole command.

1. **From the issue ticket**, list every `AC-N` (and its `FR-N`) the slice owns.
2. **For each AC**, read the FRD §13 row and record its `Validated By (Layer)`. Route it:

   | FRD AC layer                                                                     | Test layer                        | File location                                                           |
   | -------------------------------------------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------- |
   | §13.1 Backend (service/data)                                                     | Layer 2 component (service) test  | `apps/backend/.../<feature>/tests/integration/<action>.service.test.ts` |
   | §13.3 Cross-cutting (auth / tenant / permission / not-found / contract+security) | Layer 3 API E2E (Playwright)      | `apps/e2e-backend/tests/modules/.../<action>.test.ts`                   |
   | §13.2 Frontend (UI)                                                              | **Out of scope for this command** | Flag for the frontend suite; do not author here                         |

3. **For each AC**, pull the behavior from the TDD section the issue links (request/response shape, valid/invalid transitions, validation categories, error codes, skip behavior).

Output a short plan table **before writing code** — include the banded TC id range each target file will own (per the band scheme above), e.g.:

| AC    | FR       | Layer             | Band   | Target file                  | TC ids           | What it asserts                                                 |
| ----- | -------- | ----------------- | ------ | ---------------------------- | ---------------- | --------------------------------------------------------------- |
| AC-4  | FR-3,4,6 | §13.1 integration | `1xxx` | `create-…service.test.ts`    | `F6003-TC-1101…` | every validation category aggregated, batch rejected atomically |
| AC-18 | FR-1–11  | §13.3 API E2E     | `2xxx` | `create-api-keys.test.ts`    | `F6003-TC-2101…` | 401 unauthenticated                                             |

If an owned AC has no clear layer in the FRD, stop and flag it — that is a spec gap, not something to guess.

---

## Step 3 — Extract domain knowledge from the TDD

For the ACs routed to layers you own, extract before writing:

1. **TDD Domain Model & State Design** — all valid/invalid state transitions, all invariants.
2. **TDD API Design** — request shape, response shape (pagination/aggregate fields), all error codes + HTTP mappings.
3. **TDD Validation, Auth, Security** — the full list of validation categories for batch operations (do **not** hardcode a count — enumerate exactly what the FRD §12 / TDD lists for _this_ feature), permission keys.
4. **TDD Error Handling** — per-item skip behavior in bulk ops, queue-failure recovery.
5. **TDD Testing Strategy** — keep for the Step 6 cross-check.

Summarize what you extracted in a short bullet list before writing any code.

---

## Step 4 — Generate tests, layer by layer, with AC-X markers

Apply all rules from `.github/instructions/testing.instructions.md` and `.github/instructions/testing-backend.instructions.md`. **Every test file must make its AC coverage machine-checkable:**

- **File header block** lists the FRD reference and every `AC-N` the file covers, e.g.:
  ```ts
  /**
   * <Feature> — <Action> <Layer> tests
   * FRD: <feature>-frd.md
   * Acceptance Criteria Coverage:
   * - AC-4: batch validation aggregates all categories; batch rejected atomically
   * - AC-5: valid batch → queued + jobs enqueued
   * @see <feature>-frd.md §13 Acceptance Criteria
   */
  ```
- **Each test** is named `F<feat>-TC-<NNNN>: <intent>` with a banded id (Layer 2 → `1xxx`, Layer 3 → `2xxx`), one century block per file, gaps reserved. The same test also carries an inline `// AC-N: <intent>` comment so the AC marker survives refactors. Banded TC id = test name; AC marker = comment — never fold the two together (one AC owns many TCs).
- If a target file already has banded ids, continue its century block; if it has unbanded/legacy ids (e.g. `TC-0001`), renumber them into the correct band before adding new cases.

### Layer 2 — component/service tests (§13.1 backend ACs)

- Real DB/Redis, no HTTP. `node:test` + `node:assert/strict`.
- `uid()` / `Date.now()` for every unique DB field — never fixed strings.
- Cover **every** validation category the FRD/TDD enumerates for batch operations (one test each + one "all categories together" test).
- Cover **every** invalid state transition (one test each) and every valid transition with a DB read-back assertion (status, tokenVersion, …).
- Assert DB state after every mutation.

### Layer 3 — API E2E tests (§13.3 cross-cutting ACs)

- Playwright, full middleware chain (`isAuthenticated → hasPermission → resolveResources → authorize`) — the **only** layer that proves these ACs; service tests bypass it.
- Per the FRD §13.3 matrix, every mutation endpoint gets a file covering: **AC-18** 401 unauthenticated, **AC-19** cross-tenant 403/404, **AC-20** missing-permission 403, **AC-21** not-found 404, **AC-22** response-contract + input hardening (XSS/SQLi → 4xx not 500, no field leak, 409 invalid-state). Mark each with its `AC-N`.

Do not test the same concern at two layers (HTTP status, auth, zod validation → E2E only; state-machine/DB constraints → component only).

---

## Step 5 — Close the loop

After the tests are written:

1. **Update the traceability bridge.** In `implementation-traceability-bridge.md` → "Testing Coverage Mapping", replace placeholder/issue-level rows with the **real test file paths** you produced, mapped to their FR/AC.
2. **Self-verify the AC-traceability invariant** (mirror `scripts/check-spec-drift.ts`): every backend/cross-cutting AC the slice owns now appears in ≥1 test file header, and no test references an `AC-N` absent from the FRD. List any AC still uncovered and why. **Also verify TC banding:** every test name carries an `F<feat>-TC-<NNNN>` id, ids are unique within the feature, and each sits in the band its layer dictates (integration → `1xxx`, API E2E → `2xxx`) — flag any out-of-band or duplicate id.
3. **Build + run.** From `apps/backend`: `pnpm run build` must pass. If the dev stack is up, run the new files (`tsx --test <paths>` for integration; the Playwright project for E2E) and report pass/fail.
4. **Hand off.** Remind the user to run `/spec-sync <feature>` so the FRD/TDD/issue headers get re-stamped against the freshly added tests.

---

## Step 6 — Self-review against the FRD §13 AC table and TDD testing strategy

Cross-check coverage twice:

- **FRD §13** — every AC the slice owns is discharged by a test at the layer the `Validated By (Layer)` column dictates.
- **TDD Testing Strategy** — every item in the TDD's own checklist is covered; flag and explain any deliberate skip.

Report: new test files (as workspace-relative links), the AC→TC→file coverage table (showing each file's banded `F<feat>-TC-NNNN` range), build/test result, the bridge rows you updated, and the `/spec-sync` reminder.
