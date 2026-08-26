# Spec Sync (Reconciliation) Instruction

**Last Updated:** 2026-06-09
**Version:** 1.0

Use this instruction to reconcile the upstream specs (FRD, TDD, issue ticket) with what was **actually implemented**, after code lands and after each downstream artifact (runtime doc, tests, swagger) is produced.

This is the **closed-loop step** in the spec-driven workflow. Without it the pipeline is one-directional (waterfall): intent → spec → design → code, with nothing flowing back up. That is the root cause of the "spec written once, then frozen" problem — the moment implementation discovers a truth the design did not anticipate, the upstream specs silently start lying.

## Where this fits in the workflow

```
1. lovable routes + Excel workflow (PO)
2. lovable-FRD          (lovable-frd-creation.instructions.md)
3. FRD                  (frd-creation.instructions.md)        ── review gate: PO + SQA + Devs
4. TDD                  (tecnical-design-doc-guide.instructions.md)
5. Issues               (github-issue-generation.instructions.md)
6. Code + review
7. Runtime tech-doc + ADRs (technical-doc-guide.instructions.md)
8. Integration tests    (.claude/commands/generate-integration-tests.md)
9. E2E tests (Playwright)
10. Swagger docs        (.claude/commands/add-swagger-doc.md)
►► 11. SPEC SYNC  ◄◄    (this instruction)  ── run after 6, and again after 7–10
```

Run Spec Sync:

- **After step 6 (code + review)** — the highest-yield pass; implementation has just discovered new truth.
- **After steps 7–10** — a runtime doc, test, or swagger file often surfaces a fact the FRD/TDD still gets wrong.
- **Before merging the feature branch** — so the specs that ship match the code that ships.

## Core principle: one source of truth per fact

Drift happens when the **same fact is hand-authored in multiple artifacts** and they diverge. The fix is not "sync harder"; it is "stop duplicating." Assign every fact a single owning artifact. Everyone else **references** it instead of recopying it.

| Fact category                                         | Owning artifact            | Everyone else                       |
| ----------------------------------------------------- | -------------------------- | ----------------------------------- |
| Business rules, acceptance criteria, scope, non-goals | **FRD**                    | TDD/issues reference by ID          |
| Schema (tables, columns, indexes, defaults)           | **code** (`db/schema`)     | TDD *proposes*; runtime doc reflects |
| Endpoint list, routes, middleware chain               | **code** (routes)          | TDD proposes; swagger documents      |
| State/status enum values                              | **code** (constants/schema) | FRD + runtime doc reference exact values |
| State transitions                                     | **code** (services/worker) | runtime doc reflects; FRD summarizes |
| Validation rules + error messages                     | **code** (validations/constants) | FRD links; swagger documents     |
| Error catalogue → HTTP status mapping                 | **code** (services/middleware) | runtime doc + swagger document   |
| API request/response shapes                           | **code** + **swagger**     | TDD sketches                        |
| Design decisions (the "why")                          | **ADR**                    | TDD/FRD link to the ADR             |

> Rule of thumb: if a fact lives in code or constants, the spec should **reference** it, not **duplicate** it. The FRD state table should match the constants file exactly — and ideally point at the runtime doc, which is generated from code.

## Drift-prone facts checklist (the volatile surface)

These are the facts that change most often between design and implementation. Verify each against code during every Spec Sync — they are where drift concentrates:

- [ ] **Status/state enum** — does the FRD §9 / runtime doc states table list *every* value in the constants file (including ones added during implementation, e.g. a `queued` worker state)?
- [ ] **State transitions** — does each transition in the docs match the actual service/worker code, including lazy/side-effect transitions (e.g. expiry set on GET) and worker-driven ones?
- [ ] **Validation semantics** — do the documented conditions match the code? (e.g. "already invited" may check a *set* of active statuses, not a single status.)
- [ ] **Validation limits** — batch caps, min/max lengths, array sizes (e.g. `max(50)`), normalization (trim/lowercase/sanitize).
- [ ] **Error messages + codes** — exact strings and HTTP status mappings, including the `details`/error-code shape.
- [ ] **Endpoint inventory** — every live route has a swagger doc; no documented endpoint is missing from the routes file and vice versa.
- [ ] **Permissions** — the `PERMISSIONS.*` key in the route matches what the FRD/TDD claims gates the action.
- [ ] **Async/queue behavior** — every `queue.add(...)` and worker transition is reflected in the runtime doc and the FRD workflow.

## Reconciliation process

### Step 1 — Establish implementation truth

Read the **code**, not your memory of the design. Extract the current reality of each drift-prone fact above from:

- `db/schema/**` (tables, columns, defaults)
- constants/validations packages (status enums, validation rules, error messages)
- routes file (endpoint inventory, middleware chain, permission keys)
- services/worker (state transitions, `throw` sites, queue jobs)

### Step 2 — Diff against each upstream artifact

For the FRD, TDD, and issue ticket, compare documented facts to implementation truth. Record each mismatch as one of:

- **DRIFT** — doc says X, code does Y. Doc must be patched.
- **GAP** — code does something the doc never mentioned. Doc must add it.
- **STALE-REF** — doc points at the wrong artifact/path/name.
- **OK** — matches.

### Step 3 — Patch toward the source of truth

Apply fixes per the ownership table:

- If the **owning artifact** is wrong, fix it there.
- If a **non-owner duplicated** a fact and it drifted, replace the duplicate with a reference to the owner (do not re-sync the copy — remove the copy's authority).
- Never "resolve" a conflict by silently picking one side. If code and an *approved* FRD genuinely disagree on intended behavior, that is a **product decision** — raise it, do not paper over it.

### Step 4 — Stamp the reconciliation

Update each reconciled artifact's header:

- Bump `Last Updated` to today.
- Add/refresh a trace line:
  `**Last reconciled against implementation:** <YYYY-MM-DD> @ <commit-or-branch>`
- Advance `Status` if appropriate (e.g. `Draft` → `Approved`) — shipped code with `Draft` specs is itself a drift signal.

### Step 5 — Report

Produce a short reconciliation summary:

- artifacts touched
- DRIFT/GAP/STALE-REF items found and how each was resolved
- any product decisions raised (code-vs-approved-spec conflicts)
- any duplicated facts collapsed into references

## Drift detection (make it cheap and repeatable)

Spec Sync is manual judgement, but three lightweight automated checks catch the most common failures before review:

1. **Endpoint-without-swagger** — assert every route in the feature's routes file has a corresponding `swagger-docs/*.swagger.ts` path in the generated OpenAPI. (This is what catches "5 endpoints, 0 swagger docs.")
2. **Enum-vs-doc** — assert the status enum in constants matches the states listed in the FRD/runtime doc. (This is what catches a missing `queued` state.)
3. **AC-traceability** — assert every backend-scoped acceptance criterion (`AC-N`) in an FRD's acceptance-criteria table is referenced by at least one test file, and that no test references an `AC-N` absent from the FRD. (This is what keeps the FR→AC→test chain from rotting into a stale comment.) Out-of-scope (UI-only) ACs are excluded via `outOfScopeMarkers`; pre-existing untested ACs live in a `ignoreAcIds` burn-down baseline, never a permanent allowlist.

All three are implemented in `scripts/check-spec-drift.ts` (config: `scripts/spec-drift.config.json`), run on every PR via `.github/workflows/backend-ci.yml`, and run warn-only in the pre-commit hook so reconciliation failures surface without a human noticing.

A fourth, **warn-only** check complements these:

4. **Spec-staleness** (`scripts/check-spec-stale.ts`, `pnpm check:spec-stale`) — a git-history heuristic that counts how many commits have touched a feature's source code since its FRD was last updated, and warns when the gap exceeds `thresholdCommits`. Unlike the three invariants above it never fails a build (a stale FRD can be intentional); it just tells you *when to look*. It runs warn-only in the pre-commit hook. Config lives in the `specStaleness` block of `spec-drift.config.json`.

## Quality bar

A Spec Sync pass is acceptable only if:

- every item in the drift-prone checklist was verified against code (not memory)
- no documented fact contradicts the implementation
- no implemented behavior is undocumented in its owning artifact
- duplicated volatile facts were collapsed into references to their owner
- each touched artifact has an updated `Last reconciled` stamp
- genuine code-vs-approved-spec conflicts were raised, not silently resolved

## What not to do

- Do not reconcile from memory or from the previous spec — always read current code.
- Do not "fix" drift by editing the duplicate; remove the duplicate's authority and reference the owner.
- Do not silently overwrite an approved FRD to match code when the disagreement is about *intended behavior* — that is a product decision.
- Do not skip the header stamp; an un-stamped doc looks reconciled when it is not.
- Do not treat Spec Sync as one-time; it runs after code and after every downstream artifact.

## Best-use prompt

> Run Spec Sync for `<feature>`. Read the current schema, constants, validations, routes, services, and worker. Diff the implementation against the FRD, TDD, and issue ticket across the drift-prone checklist (status enum, transitions, validation semantics and limits, error messages/codes, endpoint inventory, permissions, async/queue behavior). Patch each artifact toward its source of truth per the ownership table, collapse duplicated facts into references, stamp each doc with a `Last reconciled` line, and report all DRIFT/GAP/STALE-REF items and any code-vs-approved-spec conflicts that need a product decision.
