---
description: Step 4 of the spec pipeline — generate the final GitHub-compatible issue ticket document from the FRD + TDD, per github-issue-generation.instructions.md.
allowed-tools:
  - Read
  - Write
  - Bash
  - Agent
---

# Generate Issues (Step 4 of 4)

Pipeline: `/generate-lovable-frd` → `/generate-frd` → `/generate-tdd` → **`/generate-issues`**

This command consolidates the FRD (what to build) and TDD (how to build it) into a single, GitHub-ready execution document: epic + ordered, detailed issue drafts + dependencies + blockers + release checklist.

## Step 1 — Gate check

| Required input        | How to get it                                                                                                                                | Required? |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| **Feature ID**            | e.g. `F2006`. Ask if not given.                                                                                                                | Yes       |
| **Engineering FRD**       | Auto-locate at `<feature-dir>/docs/frds/<FeatureID>-FRD-<slug>.md`. If missing, tell the user to run `/generate-frd` first.                  | Yes       |
| **TDD**                  | Auto-locate at `<feature-dir>/docs/frds/<FeatureID>-TDD-<slug>.md`. If missing, tell the user to run `/generate-tdd` first.                  | Yes       |
| **Target milestone/sprint, ADRs, team ownership** | Ask; optional — proceed with reasonable assumptions labeled as such if not provided                                    | No        |

If the feature ID is missing, stop and ask:

> Which feature ID are these issues for? (e.g. `F2006`)

If the FRD and/or TDD cannot be found, stop and ask exactly:

> I need both the FRD and TDD for `<FeatureID>` before generating issues. Missing:
>
> - [ ] FRD — run `/generate-frd <FeatureID>` first, or paste/attach one
> - [ ] TDD — run `/generate-tdd <FeatureID>` first, or paste/attach one
>
> Also — do you have a target milestone/sprint, or specific team ownership assignments I should use? (optional)

**Also verify** (per the instruction file's "when to use this"): the TDD's Open Technical Questions (§16) are resolved or explicitly converted into blocker issues. If unresolved blocking questions remain, flag them — don't silently skip them.

## Step 2 — Locate the feature directory and existing artifacts

```
find apps/backend/src/modules -type d -iname "<FeatureID>-*"
```

Resolve to the leaf feature folder as in prior steps (ask if ambiguous).

Then check for:

- `<feature-dir>/docs/frds/<FeatureID>-FRD-<slug>.md` — required source.
- `<feature-dir>/docs/frds/<FeatureID>-TDD-<slug>.md` — required source.
- `<feature-dir>/docs/supporting-docs/implementation-traceability-bridge.md` — if present, reference it rather than re-deriving the FR/AC → layer → TDD section → issue matrix.
- `<feature-dir>/docs/frds/<FeatureID>-ISSUES-<slug>.md` — if this **already exists**, this is a re-run after FRD/TDD changes: read it first to preserve any issue numbers already referenced elsewhere (e.g. commit messages, PRs).

## Step 3 — Required reading

- `apps/backend/docs/instructions/github-issue-generation.instructions.md` (full — template, and the Best-use prompt at the end).
- The FRD in full (§7 FRs, §8 BRs, §14 ACs, §18 Open Items).
- The TDD in full (§6 DB design, §7 API design, §12 Testing Strategy + §12.6 matrix, §14 Issue Breakdown Guidance, §15 ADR Candidates, §16 Open Technical Questions).

## Step 4 — Generate

Follow the instruction file's Best-use prompt:

> Generate a single final issue ticket document from the attached FRD and Technical Design Document. Include the epic summary, execution order, detailed GitHub-ready issue drafts, dependencies, blockers, suggested PR breakdown, and release-readiness checklist. Make it detailed enough to replace both a delivery plan and a separate issue-draft document.

Rules while drafting:

- Use the FRD for **what** must be built and the TDD for **how** — do not restate either document wholesale.
- Group issues by workstream (DB/migrations, backend services, API/controllers, integrations/async jobs, frontend, QA, DevOps, docs, ADR follow-ups) per §14 Issue Breakdown Guidance in the TDD.
- Every issue must be understandable on its own: scope, out-of-scope, inputs/references (specific FRD/TDD sections, not the whole doc), implementation notes, testable acceptance-criteria checklist, testing notes (unit/integration/E2E/manual/failure-path), and definition of done.
- Carry forward every unresolved TDD §16 Open Technical Question as either a blocker issue or an explicit §6 Blockers entry — never drop one silently.
- If §15 ADR Candidates weren't already promoted to real ADR files during `/generate-tdd`, create a dedicated `ADR follow-up` issue for each.
- Make dependencies and execution order explicit (migration → services → controllers → frontend → QA → release) in §5, not just implied by issue order.
- Do not include final estimates unless explicitly requested by the user.

## Step 5 — Output location

```
<feature-dir>/docs/frds/<FeatureID>-ISSUES-<slug>.md
```

## Step 6 — Report

- File path (workspace-relative link).
- Epic title + issue count by workstream.
- Blockers/open decisions carried forward from the TDD's §16, with suggested owners.
- Suggested PR breakdown summary.
- Confirm whether the release-readiness checklist and dependency graph are complete, or flag gaps.
