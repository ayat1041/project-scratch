---
description: Step 3 of the spec pipeline — generate the Technical Design Document from the engineering FRD, per tecnical-design-doc-guide.instructions.md.
allowed-tools:
  - Read
  - Write
  - Bash
  - Agent
---

# Generate TDD (Step 3 of 4)

Pipeline: `/generate-lovable-frd` → `/generate-frd` → **`/generate-tdd`** → `/generate-issues`

This command translates the (stable) engineering FRD into an implementation-ready Technical Design Document — schema, endpoints, state design, auth, testing strategy, rollout.

## Step 1 — Gate check

| Required input               | How to get it                                                                                                                                | Required? |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| **Feature ID**                  | e.g. `F2006`. Ask if not given.                                                                                                                | Yes       |
| **Engineering FRD**             | Auto-locate at `<feature-dir>/docs/frds/<FeatureID>-FRD-<slug>.md`. If missing, tell the user to run `/generate-frd` first, or ask for one.  | Yes       |
| **Supporting/architecture docs** | Any docs under `<feature-dir>/docs/supporting-docs/`, existing ADRs (`apps/backend/docs/adr/`), or sibling TDDs this feature depends on   | Ask; proceed without if user confirms none needed |

If the feature ID is missing, stop and ask:

> Which feature ID is this TDD for? (e.g. `F2006`)

If the engineering FRD cannot be found, stop and ask exactly:

> I couldn't find an engineering FRD for `<FeatureID>` at `<expected-path>`. Before I generate the TDD, I need one of:
>
> - [ ] Run `/generate-frd <FeatureID>` first, or
> - [ ] Paste/attach an existing engineering FRD to use as source
>
> Any relevant architecture constraints, ADRs, or sibling TDDs I should read first?

**Also verify** (per the instruction file's "when to use this"): the FRD's business rules and acceptance criteria are reasonably stable — i.e. §18 Open Items don't contain unresolved blockers that would invalidate the design. If §18.1 has Open (non-inherited, unresolved) conflicts, flag this to the user before proceeding — do not silently design around an open contradiction.

## Step 2 — Locate the feature directory and existing artifacts

```
find apps/backend/src/modules -type d -iname "<FeatureID>-*"
```

Resolve to the leaf feature folder as in prior steps (ask if ambiguous).

Then check for:

- `<feature-dir>/docs/frds/<FeatureID>-FRD-<slug>.md` — required source.
- `<feature-dir>/docs/supporting-docs/*` — optional.
- `apps/backend/docs/adr/` — existing ADRs that may constrain design decisions (see `.github/instructions/backend-adrs.instructions.md`).
- `<feature-dir>/docs/frds/<FeatureID>-TDD-<slug>.md` — if this **already exists**, treat as an update: read it first before regenerating.
- Existing schema/tables the feature will touch (`apps/backend/src/db/schema/`).

## Step 3 — Required reading

- `apps/backend/docs/instructions/tecnical-design-doc-guide.instructions.md` (full — template, source-of-truth ownership, and the Best-use prompt at the end).
- `.github/instructions/api-workflow.instructions.md` (established endpoint/middleware conventions this TDD must align with).
- `.github/instructions/backend-migrations.instructions.md` and `.github/instructions/backend-adrs.instructions.md`.
- The engineering FRD located in Step 2, in full — including §7 FRs, §9 State Model, §11 API Surface, §13 Validation, §14 ACs, §18 Open Items.

## Step 4 — Generate

Follow the instruction file's Best-use prompt:

> Generate a lightweight technical design document from the attached FRD. Propose the database design, endpoint design, state transitions, validation strategy, authorization model, testing strategy, rollout notes, ADR candidates, and open technical questions. Keep it implementation-oriented and concrete enough for issue breakdown, but do not generate final code or final Swagger docs. Use tables for reference data, comparisons, and matrices; use flow diagrams for sequences and state machines; avoid dense paragraphs in favor of visual structure wherever possible.

Rules while drafting:

- Treat the FRD as the source of truth for business behavior — do not restate it, reference it (§2.4 Key FRD References), splitting backend vs. frontend FR/BR/AC ranges.
- §6 Database Design and §7 API Design must be concrete: candidate columns/types, constraints, indexes, and endpoint method/route/request/response/error codes — this is the one document that owns that level of detail pre-implementation.
- Align endpoint proposals with the existing middleware chain (`isAuthenticated → hasPermission → resolveResources → authorize → controller`) from `api-workflow.instructions.md`; call out any deviation explicitly.
- §12 Testing Strategy must mirror the FRD's layer split and link every test entry to its AC(s)/FR(s), closing with a §12.6 AC→Test coverage matrix. §12.3 API E2E is mandatory whenever the feature has authenticated tenant-scoped endpoints.
- Flag every decision that should become an ADR in §15 — and if it's a genuinely load-bearing decision, recommend creating the ADR now (design time), not after code lands.
- Do not hide uncertainty — list unresolved items in §16 Open Technical Questions rather than guessing.
- If this is an update to an existing TDD, reconcile rather than blindly overwrite; note what changed and why.

## Step 5 — Output location

```
<feature-dir>/docs/frds/<FeatureID>-TDD-<slug>.md
```

## Step 6 — Report

- File path (workspace-relative link).
- §12.6 AC → Test coverage matrix summary (counts by layer).
- List of §15 ADR candidates — flag any that should be promoted to a real ADR file now, before issues are created.
- Any §16 Open Technical Questions that block issue creation.
- Remind the user: next step is `/generate-issues <FeatureID>`.
