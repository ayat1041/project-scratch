---
description: Step 1 of the spec pipeline — generate the lovable (UI-sourced) FRD from Lovable routes/components + workflow docs, per lovable-frd-creation.instructions.md.
allowed-tools:
  - Read
  - Write
  - Bash
  - Agent
---

# Generate Lovable FRD (Step 1 of 4)

Pipeline: **`/generate-lovable-frd` → `/generate-frd` → `/generate-tdd` → `/generate-issues`**

This command produces the FRD that documents the Lovable prototype **as built in the UI** — before engineering reality (schema, conventions, other FRDs) enters the picture. Do not adjudicate docs↔UI conflicts here; log them.

## Step 1 — Gate check

Confirm the following are present. If **any are missing**, stop and ask before proceeding — do not guess:

| Required input                | How to get it                                                                                                                                                        | Required?                                        |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **Feature ID**                | e.g. `F2006`. If not given, ask: *"Which feature ID is this for? (e.g. F2006)"*                                                                                       | Yes                                              |
| **Lovable prototype path**    | **Locate it — never assume.** Run the discovery in Step 2. Ask if 0 or 2+ candidates come back.                                                                       | Yes                                              |
| **Lovable routes/components** | The page(s)/component(s) under `<prototype>/src` that implement this feature's UI. Ask by path, relative to the repo root.                                            | Yes                                              |
| **Lovable base URL**          | The deployed preview address, e.g. `https://preview--<project>.lovable.app`. **`/generate-frd` reads it from this document's Related Artifacts** to build the `Lovable Reference` links in the engineering FRD. Ask if it is not already recorded. | Yes                                              |
| **Supporting workflow docs**  | Spreadsheets, PDFs, worksheets, or flow diagrams describing the intended behavior. Discover the in-repo ones in Step 2; ask for anything outside the repo.            | Ask; proceed without if user confirms none exist |

If the feature ID is missing, stop and ask exactly:

> Which feature ID is this lovable FRD for? (e.g. `F2006`)

After running Step 2's discovery, ask for whatever it did not find. Quote the paths it **did** find, so the user is confirming a list rather than typing one from memory:

> Before I generate the lovable FRD, please confirm the sources:
>
> - [ ] **Lovable prototype** — I found `<discovered path>`. Correct?
> - [ ] **Lovable routes/components** — which file(s)/folder(s) under `<prototype>/src` implement this feature's UI?
> - [ ] **Lovable base URL** — the preview address for this prototype (e.g. `https://preview--<project>.lovable.app`). `/generate-frd` needs it later to link every requirement to its screen.
> - [ ] **Supporting workflow docs** — I found `<discovered docs>`. Any others (spreadsheets, PDFs, flow diagrams) to paste or attach, or is that all of them?
>
> Please confirm and I'll proceed.

## Step 2 — Locate the feature directory, the prototype, and the supporting docs

**a. The backend feature folder.**

```
find apps/backend/src/modules -type d -iname "<FeatureID>-*"
```

- If exactly one leaf match exists (a directory containing `controllers/`, `services/`, or `routes.ts`), use it.
- If the match is a parent module folder containing nested `<FeatureID>-<slug>` leaf folders (e.g. `F6010-account-management/F6011-api-keys/`), ask the user which nested feature this FRD is for — do not guess.
- Derive `<slug>` from the leaf folder name (strip the `<FeatureID>-` prefix).

**b. The Lovable prototype.** Its location is **not fixed** — it varies by project, and it is not necessarily under `apps/`. Discover it:

```
find . -maxdepth 3 -type d -name src -not -path "*/node_modules/*" \
  -execdir test -f package.json \; -print 2>/dev/null
```

Confirm a candidate by looking for Lovable's own markers (a `supabase/` folder, `components.json`, or a `lovable` entry in `package.json`). Report the path you chose. If the search returns none, or more than one plausible prototype, **ask** — never fall back to a guessed path.

**c. The supporting workflow docs.** They live in two conventional places, and both are easy to miss:

```
ls -1 <feature-dir>/docs/supporting-docs/ 2>/dev/null
ls -1 <feature-dir>/docs/frds/*.md 2>/dev/null | grep -v "<FeatureID>-"
```

The first holds flow diagrams and exports (for example a `.excalidraw` file). The second catches stakeholder worksheets filed beside the FRDs, which do **not** follow the `<FeatureID>-` naming and are therefore invisible to a glob that assumes it. List everything both commands return, and ask whether anything outside the repo is still missing.

## Step 3 — Required reading

- `apps/backend/docs/instructions/lovable-frd-creation.instructions.md` (full — template, §12 Source Conflicts rules, and the Best-use prompt at the end).
- Every Lovable route/component file gathered in Step 1. Read the actual `.tsx`/`.ts` source — don't infer behavior from file names.
- Every supporting workflow doc gathered in Step 1.

If a supporting doc is a PDF, use Read directly (page-range it if long). If it's an Excel/CSV export saved as text, Read it as-is.

## Step 4 — Generate

Follow the instruction file's Best-use prompt:

> Create a lovable FRD for `<FeatureID>` from the attached Lovable UI routes/components and any supporting workflow docs. Document routes, user flows, data models, form specs, validation rules, state management, and edge cases exactly as implemented in the UI. Log every place the workflow docs and the Lovable UI disagree in §12.1 Source Conflicts with a stable `SC-*` ID — never silently pick a winner. Log every gap neither source answers in §12.2 Open Questions with a stable `OQ-*` ID. Use tables and Mermaid diagrams over dense paragraphs.

Rules while drafting:

- Describe the UI **as it behaves**, not as it "should" behave — this FRD is a factual transcript of the Lovable prototype plus the workflow docs, not a design decision.
- Every docs↔UI disagreement goes in §12.1 with a stable `SC-N` ID; never silently resolve.
- Every gap neither source answers goes in §12.2 with a stable `OQ-N` ID.
- Use exact Tailwind classes, state variable names, and function names as they appear in the source files.
- **Record the Lovable base URL in Related Artifacts**, on its own line, with the prototype's repo-relative source path beside it. `/generate-frd` reads this line to build every `Lovable Reference` link in the engineering FRD. If it is missing there, the next step in the pipeline has to stop and ask the user again.
- **List every source you read in Related Artifacts, by repo-relative path** — the prototype folder, each route/component file, each supporting worksheet, and each flow diagram. A source that is read but not listed cannot be re-checked later, and the engineering FRD cannot cite it.
- If a Master Registry (`README.md`) exists for this feature's FRD folder, update the route→FRD mapping row.

## Step 5 — Output location

```
apps/backend/src/modules/<module>/features/<...>/<FeatureID>-<slug>/docs/frds/<FeatureID>-FRD(lovable)-<slug>.md
```

Match the existing convention (see `F6011-FRD(lovable)-api-keys.md` for a reference example).

## Step 6 — Report

- The new/updated file path (workspace-relative link).
- **The sources actually read**, by repo-relative path: prototype folder, route/component files, worksheets, flow diagrams — plus the Lovable base URL recorded in Related Artifacts. Say plainly if the base URL is still missing, because `/generate-frd` is blocked without it.
- Count of §12.1 Source Conflicts and §12.2 Open Questions logged, with their IDs.
- Any Lovable routes/components or workflow docs you were not given but suspect exist (so the user can supply them before Step 2 of the pipeline).
- Remind the user: next step is `/generate-frd <FeatureID>`.
