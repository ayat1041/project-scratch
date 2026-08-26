---
description: Step 2 of the spec pipeline — generate the engineering FRD from the lovable FRD + any supporting workflow docs, per frd-creation.instructions.md.
allowed-tools:
  - Read
  - Write
  - Bash
  - Agent
---

# Generate FRD (Step 2 of 4)

Pipeline: `/generate-lovable-frd` → **`/generate-frd`** → `/generate-tdd` → `/generate-issues`

This command turns the lovable FRD (UI-sourced facts) plus any supporting docs into the engineering FRD — the authoritative business-requirements artifact used for scope, data model, API surface, and acceptance criteria.

## Step 1 — Gate check

| Required input                | How to get it                                                                                                                                      | Required? |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| **Feature ID**                  | e.g. `F2006`. Ask if not given.                                                                                                                      | Yes       |
| **Lovable FRD**                 | Auto-locate at `<feature-dir>/docs/frds/<FeatureID>-FRD(lovable)-<slug>.md` (see Step 2 below). If missing, tell the user to run `/generate-lovable-frd` first, or ask them to paste/attach one. | Yes       |
| **Supporting workflow docs**    | Any spreadsheets/PDFs/`.md` docs not already folded into the lovable FRD (e.g. files under the feature's `docs/supporting-docs/`)                    | Ask; proceed without if user confirms none/all already covered |

If the feature ID is missing, stop and ask:

> Which feature ID is this FRD for? (e.g. `F2006`)

If the lovable FRD cannot be found and the user hasn't provided one, stop and ask exactly:

> I couldn't find a lovable FRD for `<FeatureID>` at `<expected-path>`. Before I generate the engineering FRD, I need one of:
>
> - [ ] Run `/generate-lovable-frd <FeatureID>` first, or
> - [ ] Paste/attach an existing lovable FRD to use as source
>
> Any additional supporting workflow docs (spreadsheets, PDFs) not already reflected in the lovable FRD?

## Step 2 — Locate the feature directory and existing artifacts

```
find apps/backend/src/modules -type d -iname "<FeatureID>-*"
```

Resolve to the leaf feature folder exactly as in `/generate-lovable-frd` Step 2 (ask if ambiguous between a parent module folder and nested leaf folders).

Then check for:

- `<feature-dir>/docs/frds/<FeatureID>-FRD(lovable)-<slug>.md` — required source.
- `<feature-dir>/docs/supporting-docs/*` — optional extra workflow/reference material.
- `<feature-dir>/docs/frds/<FeatureID>-FRD-<slug>.md` — if this **already exists**, this is an update, not initial creation: read it first, and prepare to add §18 Revision History + §18.1 Changes Summary per the instruction file's guidance instead of overwriting silently.

## Step 3 — Required reading

- `apps/backend/docs/instructions/frd-creation.instructions.md` (full — template, formatting rules, source-of-truth ownership, the **Addendum: Human-Readable Writing Rules** at the end, and the Best-use prompt). Two parts change how §7 and §19.2 are drafted rather than only how they're checked: the addendum's mandatory field formats (§A5–§A9), and **"The Lovable Reference column"** under §7.
- The lovable FRD located in Step 2, in full — including §12.1 Source Conflicts and §12.2 Open Questions.
- Any supporting docs from Step 1/2.
- Existing sibling FRDs this feature depends on or integrates with (check `Related Artifacts` / cross-links in the lovable FRD).

## Step 4 — Generate

Follow the instruction file's Best-use prompt:

> Create an FRD from the attached workflow/UI artifacts. Extract all business rules, states, edge cases, assumptions, dependencies, data impact, API implications, and acceptance criteria. Keep business requirements separate from technical design details, and highlight open questions. Use tables, diagrams, and structured layouts to make the FRD easy to review — replace dense paragraphs with reference tables, state diagrams, and comparison matrices where they help readers scan quickly.

**Emit every section of the instruction file's template, in its order and with its numbering** — the unnumbered `How to Read This Document` and `Glossary`, then §1 to §20, then §21 Developer Section, then §22 On-Screen Copy Catalog when the feature has user-facing copy. Sibling documents cite these numbers (`/generate-tdd` and `/generate-issues` both reference `FRD §<n>`), so a module that renumbers them breaks its own pipeline.

Drafting order:

1. **Glossary first.** Fix one name per thing before writing §6 to §14. A domain word may not appear in the body until this table defines it. Renaming a term afterwards is how "invite link", "invitation URL", and "the link to join" all end up in one document.
2. §1 to §20, using each section's mandatory field format.
3. §21, holding the technical detail the body should not carry.
4. §22, quoting user-facing copy verbatim.

Rules while drafting:

- **Carry-forward rule (non-negotiable):** every unresolved `SC-*` / `OQ-*` from the lovable FRD is inherited into §19.1/§19.2 **by its original ID**, marked `inherited`. Do not renumber, do not re-derive, do not re-read the raw Lovable UI/Excel sources to reconstruct them.
- Add **new** `spec↔system` conflicts to §19.1 when the lovable FRD collides with existing schema, backend conventions, other FRDs, or NFRs.
- Split FRs (§7), BRs (§8), and ACs (§14) by layer (backend/frontend) with **one continuous ID sequence per artifact type** — do not restart numbering per layer.
- Every FR links to ≥1 same-layer AC; every AC links back to a same-layer FR; no cross-layer links.
- **`Lovable Reference` column (non-negotiable, §7.1, §7.2, §19.2):** every FR row and every Open Question row carries one. Write it as a bullet list — each route its own `- ` bullet, as a markdown link built from the **Lovable base URL declared in §1**, with `Tab:` / `Control:` / `Query:` / `Note:` details on their own lines beneath it. Only routes are links; tab and control names stay plain text. Cap a `Tab:` line at 5 states and a cell at 3 route bullets. When the prototype has no surface for the row, write `None — no prototype surface` plus a reason — never leave the cell blank, and never invent a route or a link target. Set §1's Lovable base URL from the lovable FRD's Related Artifacts; ask the user if it isn't recorded there.
- If the feature has authenticated tenant-scoped endpoints, include §14.3 Cross-Cutting ACs validated by **API E2E** (never a service-level integration test).
- Do not specify endpoint contracts (method/route/request/response/status codes) — that's the TDD's job. Keep §11 capability-level.
- This FRD is not marked Approved while any §19.1 conflict is Open.
- If this is an update to an existing FRD (Step 2 found one already), add §18 Revision History and §18.1 Changes Summary; do not add them for initial creation.

## Step 5 — Output location

```
<feature-dir>/docs/frds/<FeatureID>-FRD-<slug>.md
```

## Step 6 — Report

- File path (workspace-relative link).
- Table of inherited `SC-*`/`OQ-*` IDs (from the lovable FRD) vs. newly added ones in §19.1/§19.2.
- Orphan-FR / orphan-AC check result (per the linking rules in the instruction file) — flag any found.
- `Lovable Reference` coverage: how many §7 FR rows and §19.2 OQ rows carry a real route versus `None — no prototype surface`, and the §A12 column checks (all routes linked, base URL consistent, detail labels and limits respected). Any blank cell is a defect — fix before reporting.
- Whether §14.3 Cross-Cutting ACs were added and why/why not.
- Remind the user: next step is `/generate-tdd <FeatureID>`.
