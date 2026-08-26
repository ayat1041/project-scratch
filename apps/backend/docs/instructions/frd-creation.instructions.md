# FRD Creation Instruction

Use this instruction whenever you need to convert a workflow artifact, UI mockup, spreadsheet, PRD, meeting notes, or stakeholder input into a Feature Requirement Document (FRD).

## Purpose

Create an FRD that is clear enough for engineering, product, design, and QA to align on scope, rules, API needs, data model impact, acceptance criteria, and release readiness.

The FRD must reduce ambiguity before implementation begins.

## When to use this

Use this instruction when one or more of the following exist:

- workflow spreadsheets
- UI screens or prototypes
- PDFs describing states and edge cases
- stakeholder notes or chat discussions
- existing backend/frontend constraints
- partial requirements that need to be formalized

## Inputs expected

Gather as many of these as available:

- feature name
- business goal
- user types / actors
- workflow document
- UI screens / design links
- current system constraints
- backend stack and deployment context
- known edge cases
- dependencies with auth, billing, email, notifications, or third-party providers
- rollout expectations

If some inputs are missing, do not block. Make reasonable assumptions and explicitly label them as assumptions.

## Output standard

The FRD must be written in markdown and should be implementation-oriented without becoming a low-level technical design doc.

The FRD should be complete enough that the team can:

- review scope
- identify tables/entities impacted
- define endpoints needed
- write GitHub issues
- derive test cases
- agree on acceptance criteria
- spot open questions and risks

## Writing principles

- Prefer precise language over broad language.
- Separate business rules from technical decisions.
- Distinguish persisted states from computed UI states.
- Write acceptance criteria in testable form.
- Call out assumptions, dependencies, and open questions.
- Do not hide ambiguity; surface it.
- Keep the FRD readable by PM, engineering, and QA.

> **Mandatory:** every sentence in the FRD must also follow the **[Addendum: Human-Readable Writing Rules](#addendum-human-readable-writing-rules-for-frd-generation--v11)** at the end of this file. It defines sentence length, word choice, consistency, and the required FR / BR / AC / Assumption / Open-Question field formats. Run its §A12 self-check before the FRD is finished.

## Formatting for Scanability & Clarity

FRDs are read by reviewers scanning quickly for specific information. Dense prose paragraphs force readers to re-read sections to extract facts. Use tables, diagrams, and structured layouts strategically to make FRDs easier to review.

### Use Tables For

| Content Type                       | Why                                                              | Example                                                                                                                 |
| ---------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Reference data**                 | Readers scan for specific values without re-reading paragraphs   | Actors, user stories, success metrics; validation rules; state transitions; event types                                 |
| **Comparisons and matrices**       | Side-by-side options reveal patterns and coverage                | FR/AC traceability; status-based action visibility; risk/mitigation pairs                                               |
| **Structured lists with metadata** | Many fields per item; traditional bullets force repetitive prose | Requirement tables (ID + description), business rules (ID + enforcement layer), APIs (operation + scope + input/output) |
| **Categorical organization**       | Grouping by dimension avoids repetitive clauses                  | Business rules by layer (backend vs frontend); ACs by layer; entities by purpose                                        |

### Use Flow Diagrams For

| Content Type          | Why                                                         | Example                                                                                             |
| --------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **State machines**    | ASCII diagrams show valid transitions at a glance           | Invitation lifecycle: `queued` → `invited` or `sending_failed`; entry/exit conditions become visual |
| **Process sequences** | Numbered steps can be visualized if there are many branches | Complex workflows with decision points; async transitions                                           |
| **Dependency chains** | Shows which systems call which                              | Email → queue → worker → status update                                                              |

### Use Lists For

| Content Type               | Why                                                            | Example                                                                    |
| -------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **Scope (in/out)**         | Short, pithy statements; checkmarks/crosses add visual clarity | ✓ In scope / ✗ Out of scope                                                |
| **Goals and context**      | Narrative flow aids understanding                              | Non-goals, problem statement, success criteria (especially short ≤3 items) |
| **Step-by-step processes** | Sequential ordering is the point                               | End-to-end workflows (§6); error recovery steps                            |

### Avoid Dense Paragraphs For

| Content Type                 | Problem                                              | Solution                                            |
| ---------------------------- | ---------------------------------------------------- | --------------------------------------------------- |
| **Technical specifications** | Readers lose track across sentences                  | Use table with columns for each dimension           |
| **Validation rules**         | Hard to spot all 5 conditions when buried in prose   | Structured table: Rule ID, condition, error message |
| **Acceptance criteria**      | "Given/When/Then" gets lost in paragraph text        | Always use table; Given/When/Then as columns        |
| **Comparisons**              | Readers must re-read multiple paragraphs to contrast | Side-by-side table rows                             |

### Rule of Thumb

> **If you wrote the same fact twice in a section (or readers must re-read to extract a fact), use a table.**

### Real Example: Before & After

**Before (dense paragraph):**

> Invitations can be in several states. When an invitation is first created or resent, it starts in a queued state, which means the email delivery has not yet been processed. From queued, the worker can transition it to invited if the send succeeds, or to sending_failed if the send fails. Once it's invited, it can be cancelled by the user, can expire based on the lifecycle rules, can transition to declined if the recipient responds, or can fail if a retry fails. Only invited invitations can be cancelled...

**After (state transition diagram + table):**

```
CREATE/RESEND → [queued] → [invited] or [sending_failed]
[invited] → [cancelled], [expired], [declined], or [sending_failed]
[declined], [sending_failed], [cancelled] → REMOVED
```

| State       | Entry                              | Exit                                                     | User Actions                  | Notes                          |
| ----------- | ---------------------------------- | -------------------------------------------------------- | ----------------------------- | ------------------------------ |
| `queued`    | Batch create or resend + async job | Worker sends (→ `invited`) or fails (→ `sending_failed`) | Resend, Copy link             | **Not cancellable**; transient |
| `invited`   | Worker sends successfully          | User cancels, expires, declined, or fails                | Resend, Copy link, **Cancel** | Active; awaiting action        |
| `cancelled` | User cancels `invited`             | Resend or Remove                                         | Resend, Copy link, **Remove** | User-initiated; removable      |

**Result:** Reviewers scan the diagram in 10 seconds, then cross-reference the table for details — no re-reading.

### Formatting Best Practices

1. **Place diagrams before tables** when both are relevant — the diagram orients the reader.
2. **Number tables** when the section has multiple tables (Table 1, Table 2) for easy reference.
3. **Keep table columns narrow** — if content is long, split into separate rows or subsections instead.
4. **Use bold text in tables** to highlight key constraints or exceptions (e.g., `**Not cancellable**`).
5. **Cross-link between sections** — table rows often reference rules, states, or criteria by ID (e.g., "BR-4", "AC-6").
6. **Don't over-tabulate short sections** — if a section has only 2-3 items, bullet lists are fine.
7. **No blank line between items of the same list.** Write the items back to back, so the list reads as one block. Keep the blank line that separates a list from the prose above or below it — that one is doing real work.

   ```
   Bad                              Good
   - **Acronyms.** …                - **Acronyms.** …
                                    - **ID codes.** …
   - **ID codes.** …                - **Section references.** …
   ```

### When to Break the Rule

Some sections should always remain prose:

- **§2 Overview** — Summary, problem statement, goal, non-goals are narrative by design.
- **§6 End-to-End Workflow** — Step-by-step prose reads as a journey; numbered steps > table rows.
- **§17 Risks and Unusual Situations** — Risk descriptions benefit from explanation, though a risk/mitigation table works well.
- **Explanatory notes** — If a rule or requirement needs context, keep a prose note below the table rather than cramming it into a cell.

## Source of truth ownership

The FRD **owns** business rules, acceptance criteria, scope, and non-goals — author those here authoritatively.

The FRD does **not** own facts that live in code: status/state enum values, schema fields, validation conditions, error messages, and endpoint shapes. Once those are implemented, the code (constants, schema, validations, routes) is the source of truth. State them here when first specifying the feature, but treat them as **proposals that must be reconciled** — and after implementation, keep the FRD's state table, validation table, and enum values matching the constants file exactly (ideally referencing the generated runtime doc rather than re-maintaining a hand copy).

The same fact authored in the FRD, the TDD, and the schema **will** drift. After code lands, run the reconciliation pass in `spec-sync.instructions.md` to re-align this document with what was actually built.

## Required FRD structure

Use the following template.

---

# Feature Requirement Document: <Feature Name>

## How to Read This Document

An unnumbered opener, before §1. Two short paragraphs at most.

Say who the document is for, and how to use it. Name the sections a non-technical reader can stop at, and the section where the deep technical detail lives (§21). Never put a requirement here.

## Glossary — Acronyms and Key Terms

An unnumbered section, before §1. **This section is mandatory, and it is written before §6 to §14 — not after.**

Four writing rules depend on it, so an FRD without it cannot pass its own §A12 self-check:

- A domain word may only appear in the body once this table defines it. (§A3.2)
- Every abbreviation is spelled out at first use and listed here. (§A3.3)
- One name per thing, everywhere in the document. Fix the term list here first, then reuse those exact words. (§A3.1)
- A word that covers 2 different mechanisms needs 2 entries with 2 names — never 1 entry hiding both. (§A3.7)

| Term | Plain-language meaning |
| :---- | :---- |
| **Functional Requirement (FR)** | A single thing the system must do. |
| **\<domain word\>** | \<one or two sentences a non-technical reader understands\> |

## 1. Document Control

- **Feature Name:**
- **Owner:**
- **Authors:**
- **Reviewers:**
- **Version:**
- **Status:** Draft / In Review / Approved
- **Last Updated:**
- **Last reconciled against implementation:** <YYYY-MM-DD @ commit/branch, or "not yet implemented"> — see `spec-sync.instructions.md`
- **Lovable base URL:** `https://preview--<project>.lovable.app` — every link in the `Lovable Reference` column of §7 and §19.2 is this base plus the route path. **This is the only place the base is declared.** If the prototype moves, change it here, then find-and-replace the old base across the document. The base appears nowhere except inside link targets, so one replace is enough.
- **Related Artifacts:**
  - workflow doc
  - UI/prototype link
  - tickets/epic
  - technical design doc

## 2. Overview

### 2.1 Summary

Describe the feature in 2 to 5 sentences.

### 2.2 Problem Statement

What business or user problem is being solved?

### 2.3 Goal

What outcome should this feature achieve?

### 2.4 Non-Goals

Clarify what is explicitly out of scope.

## 3. Business Context

### 3.1 Actors

List all relevant actors. Example:

- Admin
- Existing registered user
- Invited user
- System/email service

### 3.2 User Stories

Write key user stories. Example format:

- As an <actor>, I want to <action>, so that <benefit>.

### 3.3 Success Metrics

Define measurable outcomes if known.

## 4. Scope

### 4.1 In Scope

List the capabilities included.

### 4.2 Out of Scope

List exclusions clearly.

## 5. Assumptions and Dependencies

### 5.1 Assumptions

Document assumptions explicitly.

### 5.2 Dependencies

Include dependencies on:

- auth/session
- email provider
- background jobs
- third-party OAuth providers
- existing user/account model
- role/permission model
- deployment/infrastructure constraints

## 6. End-to-End Workflow

Describe the feature flow from start to finish in numbered steps.

For each step, include:

- actor action
- system reaction
- decision point
- resulting state

If the workflow has multiple branches, break them into subsections.

## 7. Functional Requirements

Organize requirements **by implementation layer first, then by capability**. Split the section into a backend group and a frontend group so reviewers can see ownership boundaries at a glance and so each FR maps cleanly to a same-layer AC:

- **§7.1 Backend API & Data Operations** — endpoints, persistence, validation, error handling.
- **§7.2 Frontend UI & User Interactions** — rendering, search/filter, form behavior, dialogs, bulk actions, confirmations.

Within each layer group, cluster FRs by capability sub-section (see recommended sections below). Number FRs in one continuous sequence across both layers (FR-1, FR-2, …) — do not restart numbering per layer.

Both layer sub-sections use the **same four-column table**. The columns are mandatory — do not drop one, do not reorder them, and do not add a fifth without a version bump of this instruction:

| Column                | Contents                                                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                | `<FeatureID>-FR-<n>`, one continuous sequence across both layers                                                                     |
| **Requirement**       | The TITLE / TRIGGER / BEHAVIOR / CONDITIONS / EXAMPLE block defined in **§A5** of the writing-rules addendum                         |
| **Verified By**       | The same-layer AC id(s) from §14 that prove this FR works                                                                            |
| **Lovable Reference** | A bullet list of the prototype route(s) this requirement came from, each one a link, with its Tab / Control / Query / Note details beneath it. Format and limits are defined below — the same format governs §19.2 |

### 7.1 Backend API & Data Operations

State which concerns this layer owns, then list FRs. Every FR's requirement text must use the mandatory TITLE / TRIGGER / BEHAVIOR / CONDITIONS / EXAMPLE format defined in **§A5 of the writing-rules addendum** at the end of this file. The trigger uses exactly one of `WHEN`, `WHILE`, or `IF … THEN`, and the requirement verb is **must** — never "shall".

| ID   | Requirement                                                             | Verified By | Lovable Reference                                        |
| ---- | ----------------------------------------------------------------------- | ----------- | -------------------------------------------------------- |
| FR-1 | **<title>**<br>**WHEN** <trigger>, the system must <behavior>.<br>…      | AC-1        | - [`/auth/accept-invite`](https://preview--your-project.lovable.app/auth/accept-invite)<br>Tab: `Valid Invite` |
| FR-2 | **<title>**<br>**IF** <failure>, **THEN** the system must <behavior>.<br>… | AC-1        | - [`/auth/callback`](https://preview--your-project.lovable.app/auth/callback)<br>Query: `?error=invite_expired`<br>Note: the error lands back on the signup route |

### 7.2 Frontend UI & User Interactions

| ID    | Requirement                                                        | Verified By | Lovable Reference                                     |
| ----- | ------------------------------------------------------------------ | ----------- | ----------------------------------------------------- |
| FR-12 | **<title>**<br>**WHILE** <state>, the system must <behavior>.<br>… | AC-8        | - [`/auth/accept-invite`](https://preview--your-project.lovable.app/auth/accept-invite)<br>Tab: `Loading` |

**Cross-layer linking rule:** a frontend FR must be verified by a frontend AC, and a backend FR by a backend AC. Never point a frontend FR at a backend AC (or vice versa) — that re-introduces the layer mixing this split exists to prevent.

### The Lovable Reference column (mandatory in §7.1, §7.2, §9.x, and §19.2)

Every FR row, every state row in §9, and every Open Question row must name the prototype surface it came from. The column exists so a reviewer can open the exact screen behind a requirement without re-deriving the mapping, and so a requirement with **no** prototype surface is visible rather than silently assumed.

#### Cell structure — one bullet per route, details beneath it

A cell is a **bullet list**, never a run-on sentence. Inside a table cell, break lines with `<br>`:

1. **Each route is its own bullet**, written `- ` followed by a **markdown link**. The link text is the route path in backticks. The link target is the §1 Lovable base URL plus that path.
2. **Details sit on their own line under the route bullet**, with no leading `- `, so the route bullets stay visually distinct from their details.
3. Detail lines use these **four labels only**, in this order. Include only the ones that apply:

| Label      | Use it for                                                    | Example                                                        |
| ---------- | ------------------------------------------------------------- | -------------------------------------------------------------- |
| `Tab:`     | The named state(s) within that route                          | ``Tab: `Valid Invite`, `Declined` ``                            |
| `Control:` | A specific button, modal, or field within the state           | `Control: "Send Detach Request" modal`                          |
| `Query:`   | A query-parameter variant of the route                        | ``Query: `?invite={token}` ``                                   |
| `Note:`    | Anything else a reviewer needs — most often what does *not* exist | `Note: owned by another feature; referenced as a hand-off only` |

**Only routes are links.** Tab names, control labels, and query strings are plain backticked text. A Lovable tab is not separately addressable, so linking one produces a dead URL. Link the route; name the tab beneath it.

**A route with a path parameter is still linked as written** — `` [`/dashboard/users/:userId`](BASE/dashboard/users/:userId) ``. Add a `Note:` saying the path needs a real id. The link locates the screen; it does not open it.

#### Worked examples

**The routes and the base address below come from one feature, and are illustrative only.** Every module uses its own prototype routes, and its own base address from §1. Never copy these strings into another module's FRD.

One route, one state:

```
- [`/auth/accept-invite`](https://preview--your-project.lovable.app/auth/accept-invite)<br>Tab: `Valid Invite`
```

Two routes, one with a control and one with a query variant:

```
- [`/auth/switch-organization`](https://preview--your-project.lovable.app/auth/switch-organization)<br>Tab: `Logged In (Same Email)`<br>Control: "Send Detach Request" modal<br>- [`/auth/signup`](https://preview--your-project.lovable.app/auth/signup)<br>Query: `?invite={token}` — the live-data-wired variant
```

No prototype surface — a legitimate, and often the most useful, answer:

```
- None — no prototype surface.<br>Note: the rejection state was never built on the invited user's side, which is why this question is open.
```

#### Detail lines are written in plain words

**The writing rules apply inside this cell exactly as they apply to an FR sentence** (§A0). A detail line is short, so the temptation is to compress it into a noun chain. Do the opposite: write a short sentence a non-technical reader understands on the first read.

- **Never stack nouns** (§A2.3). A label is not an exemption from the 3-noun limit — it is where the limit gets broken most often.
- **Write a sentence, not a fragment,** whenever the fragment needs decoding.
- **Quote code-level strings exactly, then explain them.** A route, query string, status value, or component name is a fact and stays verbatim. The words around it must be plain.
- **`Tab:`, `Control:`, and `Query:` name the thing, and nothing else.** They carry the state name, the control label, or the query string — never an explanation of it. Every explanation goes on its own `Note:` line, so the fact and the plain-language gloss never fight for one line.

| Do not write                                          | Write                                                                        |
| ----------------------------------------------------- | ----------------------------------------------------------------------------- |
| `Query: ?invite={token} — the live-data-wired subset`  | ``Query: `?invite={token}` `` <br> `Note: this is the only screen connected to real invitation data.` |
| `Note: the status-key-to-template map sits in §22.1`   | `Note: §22.1 lists the exact words shown on each of these screens.`           |
| `Note: the OAuth return handler`                      | `Note: the screen a user passes through on the way back from Google or LinkedIn.` |
| `Note: the branch-selection trigger itself`           | `Note: the system runs this check before the screen shows any of its states.` |
| `Note: the `loading` status key is catalogued in §22.2` | `Note: §22.2 lists the words shown while the page is loading.`              |

#### Readability limits

- **Maximum 5 tab names on a `Tab:` line.** When a route carries more states than that, write `Tab: all 12 states` and add a `Note:` pointing at §9.1, so the state model owns the list. A cell naming 11 tabs is unreadable and duplicates §9.
- **Maximum 3 route bullets per cell.** A requirement spanning more routes than that is usually doing too much — check whether the FR should be split before widening the cell.
- **One fact per detail line.** Two notes become two `Note:` lines, never a comma chain.
- **Maximum 20 words per detail line**, the same limit every other sentence carries (§A1.2).

#### Sourcing rules

- Take route strings from the **lovable FRD** and the source workflow worksheets. Never invent or guess a route, and never invent a link target — build every target from the §1 base URL.
- The column is a **cross-reference aid, not a contract**. It records where a requirement came from; it never defines the route the real build must ship. Standardized/recommended routes belong in the developer section, not here.
- A `None — no prototype surface` value marks a requirement derived from workflow docs or engineering reality rather than from the UI — exactly the kind of gap §19.1 exists to surface. Never leave the cell blank instead.
- When a prototype route is renamed or deleted, update the cell in the same pass that updates the requirement — a stale route string is worse than an empty one.
- When the whole prototype moves, change the base URL in §1 and find-and-replace the old base. Do not hand-edit individual cells for a base change.

Each requirement should describe:

- trigger
- validations
- system behavior
- output/result

### Recommended capability sections

Use only the sections relevant to the feature, such as:

- creation/submission flow
- validation flow
- status handling
- invite or token flow
- account matching / authentication flow
- list/search/filtering behavior
- notifications / emails
- admin actions
- error handling
- audit and logging requirements

## 8. Business Rules

List strict rules separately from the functional flow. **Group them by layer** the same way as §7 — a backend rules sub-section and a frontend rules sub-section — so each rule's enforcement owner is unambiguous:

- **§8.1 Backend Rules (API & Data)** — atomicity, state-transition eligibility, ownership scoping, soft-delete, sort order.
- **§8.2 Frontend Rules (UI & UX)** — search/filter behavior, prepend-on-create, inline-vs-confirmed actions, copy-link availability.

Use rule IDs in one continuous sequence across both layers (do not restart per layer):

### 8.1 Backend Rules (API & Data)

- **BR-1:** <rule>
- **BR-2:** <rule>

### 8.2 Frontend Rules (UI & UX)

- **BR-8:** <rule>

Examples:

- invitation link expires after 30 days (backend)
- duplicate emails in the same request are rejected (backend)
- search filtering is case-insensitive on email only (frontend)
- new records are prepended to the list after submit (frontend)

## 9. State Model

This section lists every situation the feature's records and screens can be in.

Give each group of states its own sub-section — §9.1, §9.2, and so on. Split persisted entity states (what a record is) from computed screen states (what a person sees) whenever both exist.

**Every sub-section under §9 uses the same 5-column table.** A reader who learns the shape once should not have to re-learn it at §9.3. Do not vary the columns between sub-sections.

| \# | State | When it happens | What the user can do next | Lovable Reference |
| :---- | :---- | :---- | :---- | :---- |
| 1 | \<state name\> | \<the condition that produces it, in plain words\> | \<the action offered, or "Nothing" and why\> | \<route bullet + `Tab:`, per §7's column format\> |

Column rules:

- **`#`** — number the states so other sections can cite one (`§9.1 #4`). Numbers are append-only, exactly like IDs.
- **`State`** — the name a reader will see used everywhere else in the document. One name per thing.
- **`When it happens`** — the entry condition, in plain words. Not a code value.
- **`What the user can do next`** — the exit condition, expressed as the action offered. Write `Nothing` plus the reason when a state is terminal, rather than leaving the cell blank.
- **`Lovable Reference`** — the same bullet-and-link format §7 defines, naming the prototype screen and its `Tab:`. This is what lets a §7 requirement say "all 12 states — see §9.1" and have that pointer lead somewhere real.

**Keep prototype-completeness detail out of these tables.** Whether the prototype wired a given state to live data is implementation trivia, not a requirement, and a non-technical reader cannot act on it. Record it once in §21 and, when it carries build risk, as an assumption or a §17 risk row. A column such as "Backed by real data in the prototype?" reads to a reviewer as "these states are optional", which is the opposite of what it means.

## 10. Data Impact

Describe data entities likely affected.

For each entity/table, include:

- purpose
- whether new or existing
- key fields
- relationships
- uniqueness/constraints
- audit needs

Do not fully design the schema here unless required, but include enough detail for engineering planning.

## 11. API Surface & Integrations (capability-level)

Summarize the API footprint this feature implies **at the capability level**, plus the external systems it touches. This section exists so an FRD reviewer can see the API surface at a glance before any TDD exists — it is a consolidated index, not a contract.

Include:

- the operations the feature needs, as capabilities (e.g., list, create batch, resend, cancel, remove) — not endpoints
- the external integrations involved (e.g., email provider, queue/jobs, OAuth, third-party APIs), or a pointer to §5.2 Dependencies

Do **not** specify endpoint contracts here — method, route, request/response shapes, and status codes are owned by the **TDD's API Design Proposal**, the implementation, and the swagger docs. Restating them in the FRD creates a second, vaguer copy of the contract that drifts (and is strictly inferior to the TDD's version). The concrete capabilities are usually already expressed in §7 Functional Requirements; keep this section a short summary of them plus integration touchpoints.

## 12. Screens & User Experience (Optional for Backend-Focused FRDs)

If included, map functional states to screens/components/routes. For backend-oriented FRDs, this section may be omitted or kept minimal.

When including UX mapping:

- Include: route/page names, functional triggers, state transitions
- Exclude: UI-specific details like button labels, CSS classes, colors, Tailwind utility classes, exact dialog copy, icon choices, layout dimensions
- Focus on: what system states exist and how transitions occur, not how they visually appear

For each screen/state, include:

- route or page name
- functional trigger
- error/empty states (functional, not UI copy)

## 13. Validation and Error Handling

Describe all validations and user-facing error cases in detail. Use a structured table format to capture each validation rule with its condition, error message, and backend behavior.

### Validation Table Structure

For each validation rule, include:

- Rule ID (e.g., V1, V2, V3)
- Rule name (e.g., "Format", "Duplicates", "Already invited")
- Condition (the exact check or regex pattern)
- Error message (the exact string shown to the user)
- Expected system behavior (block, allow, defer, etc.)

### Example Format

| #   | Rule       | Condition                                           | Error Message                 |
| --- | ---------- | --------------------------------------------------- | ----------------------------- |
| V1  | Format     | Email does not match `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` | `*Invalid email(s): {list}`   |
| V2  | Duplicates | Same email appears multiple times                   | `*Duplicate email(s): {list}` |

For each validation case, define:

- Condition (specific check, regex, or business rule)
- Expected system behavior (block submission, show message, partial success, etc.)
- Expected user message (exact error text if known)

## 14. Acceptance Criteria

Write testable acceptance criteria using Given/When/Then where possible. **Link each AC bidirectionally: to the FR(s) it verifies, and — via the "Validated By (Layer)" column — to the test layer/file that validates it.**

**Split ACs by layer**, mirroring §7 and §8: a backend AC sub-section and a frontend AC sub-section. Number ACs in one continuous sequence (do not restart per layer). Every AC's `Requirement (FRs)` must reference same-layer FRs only.

### Acceptance Criteria Table

Every AC table must include a **"Validated By (Layer)"** column naming the responsible test **layer + intent** — e.g. "Backend: integration test — list endpoint + filtering", "Frontend: search filter component test", "API E2E: tenant-isolation cases". **It must be authorable before any code or test exists**, so it describes the test's _responsibility_, not a file path.

**Do not put concrete test filenames in the FRD.** At FRD-authoring time the files do not exist; written up front they are fabricated, and after implementation they drift on every rename/split. The AC ↔ concrete-test-file binding lives where it stays correct on its own:

- the **test file's header comment** (`AC-X` markers) — drift-proof, because the file names itself;
- the **TDD's AC → Test matrix** and the **traceability bridge** — which are _reconciled against implementation_, so real file paths are appropriate there _after_ code lands.

**This column is the single source of truth for per-AC test _layer_** — do not also maintain a separate coverage-audit table (it duplicates the column and drifts).

#### §14.1 Backend ACs (API & Data Operations)

| ID   | Requirement (FRs) | Given     | When     | Then     | Validated By (Layer)                                  |
| ---- | ----------------- | --------- | -------- | -------- | ----------------------------------------------------- |
| AC-1 | FR-1, FR-2        | <context> | <action> | <result> | Backend: integration test — list endpoint + filtering |
| AC-3 | FR-7              | <context> | <action> | <result> | Backend: service test — sort order                    |

#### §14.2 Frontend ACs (UI & User Interactions)

| ID   | Requirement (FRs) | Given     | When     | Then     | Validated By (Layer)                      |
| ---- | ----------------- | --------- | -------- | -------- | ----------------------------------------- |
| AC-2 | FR-16             | <context> | <action> | <result> | Frontend: search filter component test    |
| AC-8 | FR-12, FR-13      | <context> | <action> | <result> | Frontend: tab component + selection tests |

#### §14.3 Cross-Cutting ACs (Authorization, Permissions, Tenant Isolation)

Add this sub-section whenever the feature exposes authenticated, tenant-scoped endpoints. These ACs are **not endpoint-specific** — they assert request-lifecycle guarantees (authentication, permission gating, tenant/ownership isolation, not-found, status-code/contract conformance, input hardening) that apply across every endpoint.

**Why they get their own layer:** service-level integration tests call the service directly and **bypass the middleware chain** (`isAuthenticated → hasPermission → resolveResources → authorize`). Authentication, permissions, and tenant isolation can only be proven by hitting the real HTTP route — i.e. **API E2E tests (Playwright)**. So these ACs always carry `API E2E` in the "Validated By (Layer)" column, never `Backend: …service.test.ts`.

| ID    | Requirement (FRs)         | Given                              | When                  | Then                                                                                             | Validated By (Layer)               |
| ----- | ------------------------- | ---------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------- |
| AC-18 | FR-1–FR-N (all endpoints) | Any endpoint                       | No valid session      | 401 + error contract; no state change                                                            | API E2E: auth cases                |
| AC-19 | FR-1–FR-N (all endpoints) | Tenant B vs tenant A's resource    | B targets A's id      | 403/404; A's data unchanged & undisclosed                                                        | API E2E: cross-tenant cases        |
| AC-20 | <gated FRs>               | User lacking required permission   | Gated endpoint called | 403; no state change                                                                             | API E2E: permission-gate cases     |
| AC-21 | <resource FRs>            | Authorized caller; non-existent id | Endpoint called       | 404 + error contract                                                                             | API E2E: not-found cases           |
| AC-22 | FR-1–FR-N (all endpoints) | Any response                       | Returned              | Matches documented contract; no internal-field leak; malformed/malicious input → 4xx (never 500) | API E2E: contract + security cases |

Acceptance criteria should cover:

- happy path
- edge cases
- failure states
- authentication, permissions, and tenant isolation (cross-cutting, §14.3 — API E2E)
- idempotency where relevant
- audit/logging expectations if critical

### Coverage & cross-artifact traceability

The "Validated By (Layer)" column records each AC's layer and test file inline, so **no separate coverage-audit table is needed in the FRD**. When a value chain across multiple artifacts is required — FR/AC → implementation layer → TDD design section → GitHub issue — capture it **once** in a dedicated traceability bridge document (e.g. `implementation-traceability-bridge.md`) rather than re-deriving it inside the FRD, TDD, and issue docs separately. The FRD links to that bridge; it does not host the matrix.

State the test-layer ownership convention once (near the AC tables or in the bridge):

- Backend ACs (§14.1) → Node.js **integration** tests with real DB/Redis, below the HTTP layer; discover via `grep "AC-X" *.test.ts`. These do **not** exercise auth/permission/tenant middleware.
- Cross-cutting ACs (§14.3) → **API E2E** tests (Playwright) against the live route through the full middleware chain; this is the only layer that proves authentication, permissions, and tenant isolation.
- Frontend ACs (§14.2) → Next.js component/integration tests + **UI E2E** journeys; discover via `grep "AC-X" *.test.tsx`.
- Every test file header carries the `AC-X` comment(s) it covers (see "Testing Strategy & Requirements Traceability" below).

### Linking rules & Orphan FR Detection

**Every FR in §7 must link to at least one AC; every AC must link back to an FR — and both must be in the same layer.**

| Rule                              | Check                                                                                              | Action                                                                                                                                           |
| --------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **No orphan FRs**                 | Scan §7: are there FRs with no "Verified by: AC-X" link?                                           | Add a same-layer AC, or mark the FR's layer explicitly if its AC lives in the other layer's table                                                |
| **No orphan ACs**                 | Scan §14: are there ACs with no FR reference in the "Requirement (FRs)" column?                    | Delete the AC or add the FR(s) it actually verifies                                                                                              |
| **No cross-layer links**          | Does any frontend FR point at a backend AC (or vice versa)?                                        | Repoint to a same-layer AC; create one if none fits                                                                                              |
| **Cross-cutting ACs use API E2E** | Do §14.3 authz/permission/tenant ACs reference all endpoint FRs and carry `API E2E` in the column? | These are exempt from the single-same-layer-FR rule (they span every endpoint); ensure they are not assigned to a service-level integration test |
| **Test layer assigned**           | Does every AC name a layer/file in its "Validated By (Layer)" column?                              | If not, assign a layer + test, or mark the test "pending" in the column itself                                                                   |

**Example: layer split + orphan resolution in the invitations feature**

- FR-1 through FR-34 exist; FRs were first split into backend (FR-1–FR-11) and frontend (FR-12–FR-34).
- Many UI-behavior FRs (rendering, filtering, bulk selection, form state) initially had no AC.
- Solution: created frontend ACs (AC-8, AC-9, AC-11–AC-17) for the orphan UI FRs and linked them back in §7.2; kept backend ACs (AC-1, AC-3–AC-7, AC-10, AC-14) pointing only at backend FRs.
- Result: every FR links to ≥1 same-layer AC; every AC links back to same-layer FRs; per-AC test layer is in the "Validated By (Layer)" column; cross-artifact mapping lives in the bridge doc.

## 15. Quality & Safety Expectations (Non-Functional Requirements)

Include relevant items such as:

- security
- performance
- rate limiting
- observability
- idempotency
- reliability
- rollback safety
- compliance/privacy
- accessibility

## 16. Analytics / Audit / Logging

Define what events should be tracked or logged.

Examples:

- invitation created
- email sent
- email send failed
- invite opened
- invite accepted
- invite declined
- mismatch detected

Include identifiers needed in logs if known.

## 17. Risks and Unusual Situations

List meaningful risks and uncommon scenarios.

Examples:

- stale invitation used after resend
- same user invited to multiple resources at once
- OAuth provider returns different primary email than expected
- user refreshes during validation flow
- partial success in bulk submission

## 18. Revision History (Optional — Include when updating an existing FRD)

When the FRD is updated post-approval, include a version history table showing all changes over time.

| Version   | Date   | Author | Changes |
| --------- | ------ | ------ | ------- |
| (current) | (date) | (name) | ...     |

## 18.1 Changes Summary (Optional — Include when updating an existing FRD)

When updating an approved FRD, include a summary immediately after Revision History that highlights:

- Affected sections
- Key behavior changes (before/after)
- Implementation impact (for each team: frontend/backend/QA)
- Rationale for the changes

This helps reviewers quickly understand what changed without re-reading the entire document.

## 19. Open Items / Decisions Needed

This section is the team's decision surface. It must **drain before this FRD moves Draft → Approved** — an approved FRD with an open conflict means code will be generated from a contradiction, which is exactly what the spec-driven loop exists to prevent.

**Carry-forward rule:** Open Source Conflicts and Open Questions from the upstream lovable FRD are inherited here **by their original ID** (e.g., `SC-1`), marked `inherited`. Do not renumber or re-derive them, and do not re-read the raw Lovable UI / Excel docs to reconstruct them — the lovable FRD already owns docs↔UI detection. Re-reading the raw sources is warranted only when a human is adjudicating a specific inherited conflict.

### 19.1 Source Conflicts

Two kinds of conflict live here:

- **Inherited (docs ↔ UI)** — open `SC-*` items carried forward from the lovable FRD.
- **New (spec ↔ system)** — disagreements that only surface when the lovable FRD meets engineering reality: existing schema, backend conventions, other FRDs, NFRs, or already-shipped behavior.

| ID   | Axis                | What the spec says | Conflicting reality | Impact | Proposed resolution | Decision / Owner | Status |
| ---- | ------------------- | ------------------ | ------------------- | ------ | ------------------- | ---------------- | ------ |
| SC-1 | docs↔UI (inherited) | ...                | ...                 | ...    | ...                 | @owner — pending | Open   |
| SC-7 | spec↔system         | ...                | ...                 | ...    | ...                 | @owner — pending | Open   |

Do not delete a settled row — mark it `Answered <date>` with the chosen answer, so the review history is preserved.

### 19.2 Open Questions

Open items — inherited `OQ-*` gaps plus new ones — that need a product, engineering, security, or ops decision. Each must be specific and answerable. A question that turns out to be purely technical may graduate into the TDD's §16 Open Technical Questions; cross-reference rather than duplicate.

This table carries the same **mandatory `Lovable Reference` column** as the §7 FR tables — same bullet format, same four detail labels, same limits, same sourcing rules. For an open question the cell names the prototype surface the question is *about*, which is often the most useful fact in the row: it is frequently a screen or state the prototype **never built**. Link the route that should have carried the missing state, and say on a `Note:` line what is absent from it. When no route comes close, use the `None — no prototype surface` form. Saying so out loud is what makes the gap reviewable.

| ID   | Question | Owner | Status | Resolution (+ date) | Lovable Reference                                          |
| ---- | -------- | ----- | ------ | ------------------- | ---------------------------------------------------------- |
| OQ-1 | ...      | ...   | Open   | —                   | - [`/auth/switch-organization`](https://preview--your-project.lovable.app/auth/switch-organization)<br>Tab: `Logged In (Same Email)`<br>Note: no `Rejected` tab exists — the invited-user-facing rejection state was never built |
| OQ-2 | ...      | ...   | Open   | —                   | - None — no prototype surface.<br>Note: the question comes from the workflow notes; the prototype has no screen for it |

Write the resolution in the `ANSWER` / `SOURCE` / `LEFT OPEN` shape defined in **§A9** of the writing-rules addendum.

## 20. Delivery Notes

Optionally include planning notes useful for implementation readiness:

- expected DB changes
- expected new endpoints
- migration needs
- background job needs
- feature flag recommendation
- rollout or backfill considerations

## 21. Developer Section

The one place deep technical detail is allowed to live. Everything above §21 is written for a non-technical reader; §21 is written for the engineer building the feature.

**Relocate into it, never delete.** When a fact is too technical for the body — exact route strings, component names, prototype state keys, algorithms, queue or middleware internals — move it here and leave the plain-language version in the body. This is the section the `frd-readability-review` skill relocates into.

Use the sub-sections the feature actually needs. Common ones:

- **§21.1 Routes & Screen Mapping** — the prototype route strings behind the §7 `Lovable Reference` column, and how they map to real application routes.
- **§21.2 <domain> internals** — resolution order, guard conditions, and the checks behind a branching FR.
- **§21.3 Prototype state values** — the literal status keys the prototype uses.
- **§21.4 <integration> implementation notes** — email templates, jobs, third-party specifics.

Sibling documents cite these sub-sections by number (the TDD and the issue doc both do), so **never renumber a §21.x sub-section once it exists**.

## 22. On-Screen Copy Catalog (Include when the feature has user-facing copy)

The verbatim record of every word the user sees: screen text, button labels, inline errors, and email bodies.

**This section is exempt from the writing rules, and deliberately so.** Copy is quoted exactly as the source has it, wrong wording and all. Never reword an entry to read better — if the copy itself is wrong, quote it here and log the problem as a §19.1 Source Conflict or a §17 risk.

Use the sub-sections the feature needs, for example:

- **§22.1 Status key → template map** — which message each state shows.
- **§22.2 … §22.5** — one sub-section per screen, form, or message group.
- **§22.6 Copy problems found while cataloguing** — wording that is wrong, contradictory, or missing.

Curly braces mark a value the system fills in — `{user name}`. Say so once, at the top of the section.

---

## FRD creation process

When using this instruction, follow this sequence:

### Step 1: Extract source facts

Read the workflow/UI/source artifact and extract only factual behavior first.

Create a notes section with:

- actors
- actions
- validations
- states
- edge cases
- timings/expiry
- integrations

### Step 2: Surface contradictions (do not silently settle them)

If sources conflict, record the conflict in §19.1 Source Conflicts — not in §5.1 Assumptions, and not by silently picking a winner.

- Inherit open `SC-*` / `OQ-*` items from the upstream lovable FRD by their original ID (marked `inherited`); do not renumber or re-derive them, and do not re-read the raw Lovable UI / Excel docs to reconstruct them.
- Add new spec↔system conflicts (lovable FRD vs existing schema, backend conventions, other FRDs, NFRs) as fresh `SC-*` rows.
- Settle it automatically (prefer-the-latest-source) only when one source is unambiguously newer **and** authoritative. Otherwise leave it `Open` for review.

### Step 3: Group requirements

Cluster facts into:

- workflow stages
- business rules
- state logic
- API/data impact
- acceptance criteria

### Step 4: Draft the FRD

Fill the template completely.

### Step 5: Quality check

Before finalizing, verify:

- no major workflow branch is missing
- states are clearly differentiated
- business rules are not buried in paragraphs
- acceptance criteria are testable
- open questions are explicit
- scope and non-goals are clear
- every `Lovable Reference` cell in §7.1, §7.2, §9.x, and §19.2 passes the column checks in **§A12** — bullets, linked routes, the four detail labels, and the stated limits

## Quality bar checklist

An FRD produced with this instruction is acceptable only if:

- it can be used to create GitHub issues without re-reading the raw workflow repeatedly
- QA can derive test scenarios from it
- backend can identify likely tables/endpoints impacted
- frontend can map states to screens
- PM can review scope and edge cases
- open ambiguities are listed explicitly
- every §19.1 Source Conflict is either Answered (with a recorded decision) or explicitly Open for review — none settled in silence
- the FRD is not marked Approved while any §19.1 conflict is Open
- **FRs, BRs, and ACs are split by layer** (§7.1/§7.2 backend/frontend; §8.1/§8.2; §14.1/§14.2/§14.3) with one continuous ID sequence per artifact type
- **every FR row in §7.1 and §7.2, every state row in §9, and every Open Question row in §19.2, carries a filled `Lovable Reference` cell** — a bullet list of linked routes with their `Tab:` / `Control:` / `Query:` / `Note:` details, or an explicit `None — no prototype surface` with a reason; never blank, never invented, never an unlinked route string
- **cross-cutting authz/permission/tenant ACs exist in §14.3 and are validated by API E2E** (not service-level integration tests) whenever the feature has authenticated, tenant-scoped endpoints
- **every FR in §7 links to at least one same-layer AC in §14** — no orphan FRs, no cross-layer links
- **every AC in §14 links back to a same-layer FR in §7** — no orphan ACs
- **every AC in §14 names a test layer/file in its "Validated By (Layer)" column** — traceability from requirement to test layer lives in the column, not a separate audit table
- **no duplicated coverage matrix** — cross-artifact mapping (FR/AC → layer → TDD section → issue) lives once in the traceability bridge doc, referenced from the FRD
- **for FRD updates (post-approval):** Revision History (§18) and Changes Summary (§18.1) are included so reviewers can quickly understand what changed without re-reading the full document

## Revision History and Changes Summary (Detailed Guidance)

### When to Include These Sections

**Always include for:**

- Approved FRDs being revised post-launch with material changes to behavior, rules, or scope
- Major version bumps that affect implementation

**Optionally include for:**

- Draft FRDs undergoing significant revision before approval (helps reviewers see the evolution)

**Do NOT include for:**

- Initial FRD creation
- Cosmetic or clarification-only updates
- Minor typo fixes or grammar corrections

### Revision History (§18)

**Purpose:** Track all versions of the FRD so reviewers can understand the document's evolution over time.

**Format:**

| Version | Date       | Author  | Changes                                                |
| ------- | ---------- | ------- | ------------------------------------------------------ |
| 2.1     | 2026-06-22 | System  | Updated Copy Link availability rules per user feedback |
| 2.0     | 2026-06-16 | Product | Approved — FRs/ACs split by layer                      |
| 1.0     | 2026-04-01 | Product | Initial FRD created from workflow                      |

**Guidelines:**

- List versions in reverse chronological order (newest first)
- Include version number, date, author, and concise change summary
- For the current version, use today's date
- Use semantic versioning: `X.0` for major (approval/significant changes), `X.Y` for minor (clarifications/updates)

### Changes Summary (§18.1)

**Purpose:** Help reviewers quickly understand what changed without re-reading the entire FRD.

**When to include:** Immediately after Revision History, before § 18 (Open Items).

**Placement in document:**

```
## 18. Revision History

[version table]

## 18.1 Changes Summary (v2.0 → v2.1)

[overview + affected sections + behavior changes + impact + rationale]

## 18. Open Items / Decisions Needed
```

**Structure:**

1. **Brief Overview** — What changed and why (1-2 sentences)

   ```
   This version restricts Copy Link visibility to statuses where the invitation
   link is known to be functional, based on user feedback and support analysis.
   ```

2. **Affected Sections Table** — Which parts of the FRD were modified

   ```
   | Section | Change | Rationale |
   | ------- | ------ | --------- |
   | §7.2.4  | Updated Row-Level Actions | Expired/declined/cancelled exclude Copy Link |
   | §9.2    | Updated BR-10 | Copy Link only for invited/sending_failed |
   | §17     | Updated edge case | Reflects new Copy Link visibility |
   ```

3. **Key Behavior Changes** — Before/after comparison (if material changes exist)

   ```
   | Aspect | Before | After | Impact |
   | ------ | ------ | ----- | ------ |
   | Copy Link availability | All non-deleted statuses | Only invited/sending_failed | Reduces user confusion |
   ```

4. **Implementation Impact** — Guidance for each team

   ```
   - **Frontend:** Hide Copy Link button; render dash (—) for expired/declined/cancelled
   - **Backend:** No API changes required
   - **Tests:** Verify Copy Link hidden for non-functional statuses
   - **QA:** Test Copy Link visibility across all status transitions
   ```

5. **Rationale** — Business or UX reasoning (1-2 sentences)
   ```
   Restricting Copy Link to functional statuses prevents users from copying
   links that will not work. This reduces support requests and improves clarity.
   ```

**Real example (from a user-invitations FRD):**

```markdown
## 18.1 Changes Summary (v2.0 → v2.1)

This version consolidates UI specification updates from the lovable FRD
based on refined Copy Link visibility rules. The changes promote clarity
by restricting Copy Link to invitation statuses where the link is known
to be functional.

### Affected Sections

| Section | Change                           | Rationale                                     |
| ------- | -------------------------------- | --------------------------------------------- |
| §7.2.4  | Row-Level Actions by Status      | `expired` and `cancelled` exclude Copy Link   |
| §9.2    | Business Rule F2006-BR-10        | Copy Link only for `invited`/`sending_failed` |
| §17     | Edge Cases — Expired Invitations | Reflects Copy Link hidden state               |

### Key Behavior Changes

| Aspect                 | Before                   | After                           | Impact                 |
| ---------------------- | ------------------------ | ------------------------------- | ---------------------- |
| Copy Link availability | All non-deleted statuses | Only invited and sending_failed | Reduces user confusion |

### Implementation Impact

- **Frontend:** Hide Copy Link action; render dash (—) for expired/declined/cancelled
- **Backend:** No API changes
- **Tests:** Verify Copy Link hidden for expired/declined/cancelled statuses

### Rationale

Restricting Copy Link to functional statuses prevents user confusion and
reduces support requests. Expired/declined/cancelled represent terminal states
where the original link is non-functional.
```

## Testing Strategy & Requirements Traceability

After the FRD is approved, each test file should include a **header comment** that links back to the FRD:

```typescript
/**
 * Tests for [Feature Name]
 *
 * FRD: @link-to-frd-file
 *
 * Acceptance Criteria Coverage:
 * - AC-5: Batch creation happy path (valid emails → invitations created, prepended, dialog closes)
 * - AC-4: Batch validation (duplicate, already invited, invalid format → all errors shown together)
 * - AC-6: Row cancel (invited → cancelled status, row visible)
 *
 * @see frd-user-invitations-tab.md
 */
```

**Benefits:**

- Developers can instantly see which ACs a test file covers.
- QA can verify which ACs lack test coverage.
- When a requirement changes, you can grep the test header to find affected test files.
- Traceability chain is complete: FR → AC → Test code.

This header should be added when tests are first written, and updated whenever ACs change or new tests are added.

## What not to do

- Do not turn the FRD into a full technical design doc.
- Do not invent low-level database schemas unless the task explicitly asks for them.
- Do not skip edge cases from the workflow artifact.
- Do not merge business state and UI/session state into one unclear status list.
- Do not write vague acceptance criteria like “works as expected.”
- Do not omit assumptions.
- Do not include UI-specific details like CSS classes, Tailwind utilities, button labels, icon names, dialog dimensions, or color schemes unless they encode business logic.
- Do not defer validation rule details to “the source artifact”—capture exact conditions and error messages in the FRD itself as a structured table.
- Do not specify endpoint contracts (method, route, request/response shapes, status codes) in the FRD — the API contract is owned by the TDD's API Design Proposal, the code, and the swagger docs. Keep §11 capability-level.

## Optional companion outputs

After producing the FRD, the next recommended outputs are:

1. open questions list
2. API candidate list
3. table/entity impact summary
4. GitHub epic and issue breakdown
5. acceptance-test checklist

## Best-use prompt

Use this instruction with a prompt like:

> Create an FRD from the attached workflow/UI artifacts. Extract all business rules, states, edge cases, assumptions, dependencies, data impact, API implications, and acceptance criteria. Keep business requirements separate from technical design details, and highlight open questions. Use tables, diagrams, and structured layouts (see "Formatting for Scanability & Clarity") to make the FRD easy to review—replace dense paragraphs with reference tables, state diagrams, and comparison matrices where they help readers scan quickly.

---

# Addendum: Human-Readable Writing Rules for FRD Generation — v1.1

> **How to use this addendum:** It changes HOW the FRD is written, not WHAT it contains. Every sentence of every FRD produced with this instruction must follow these rules.
>
> **What changed in v1.1:**
>
> 1. EARS added to the cited basis.
> 2. FR format: the TRIGGER field now has three forms (WHEN / WHILE / IF-THEN), following the EARS patterns, with a fixed clause order.
> 3. FR format: a new optional WHY field for rationale, excluded from testing.
> 4. Modal verbs rule: a note explaining our deliberate difference from the industry's "shall".
> 5. Self-check: three new checklist items.
> 6. The fixed-interface list now includes the new field names (WHILE, IF–THEN, WHY).
> 7. All rule text is written without internal system names, so the dev team can read this instruction with no outside vocabulary.

> **Basis:** These rules follow the principles of ASD-STE100 (Simplified Technical English, the aerospace writing standard for non-native readers), ISO 24495-1 (Plain Language), the GOV.UK style guide, and the EARS notation (Easy Approach to Requirements Syntax, Mavin et al., Rolls-Royce, 2009) for requirement sentence patterns — adapted for functional requirements. Each rule exists because of how human working memory reads: a reader can hold only a few unfinished things in mind at once. Every rule either closes an idea quickly or stops the writer from forcing the reader to hold too many things open.
>
> **Warning to future maintainers:** The field names in Sections 5–9 (TITLE, TRIGGER, BEHAVIOR, CONDITIONS, EXAMPLE, THE RULE, EXCEPTION, THE ASSUMPTION, SOURCE, IF WRONG, ANSWER, LEFT OPEN, WHILE, IF–THEN, WHY) are **fixed interfaces**. The document parser and downstream document generators (test cases, manuals, proposals) extract content by these exact names. Renaming any of them is a breaking change to those systems, not a style choice. Do not rename them without a version bump of this instruction and a matching update everywhere they are consumed.

---

## A0. Scope — what this addendum does and does not change

**Nothing structural changes.** Keep exactly as they are today:

- All section numbers, section order, and section names.
- All ID schemes and the append-only, never-renumber rule.
- All tables and their columns.
- The source-priority rule, the revision-history discipline, and the inherited-ID rules.
- The Glossary, the verbatim copy catalogs, and the developer section.

**Only the writing changes.** The target reader for every sentence is:

> A person with NO technical background, reading in their second language, who can follow clear instructions — a new QA tester on day one, a client's operations manager, a junior salesperson. This person must be able to read any FR or BR once and correctly say what the system does.

If that person would stop, re-read, or guess — rewrite.

**Every word in the document counts, including every word inside a table cell.** These rules are not limited to requirement sentences. They apply the same way to:

- every cell of every table, in every column — `Lovable Reference`, `Verified By`, `Validated By (Layer)`, `Details`, `Status`, `Notes`, and any other;
- every `Note:`, `Why:`, and label line;
- every heading, intro line, list item, and diagram caption.

A short label does not earn an exemption. **A 4-word cell can break rule 2.3 harder than a 20-word sentence does.** `the live-data-wired subset` and `the status-key-to-template map` are both 4-noun chains, and both are unreadable to the target reader — a full sentence saying the same thing in plain words is shorter to understand, even when it is longer to print. The only exemptions are the ones §A0 already names: verbatim copy catalogs, and code-level strings quoted as facts (route paths, query strings, status values, component names). Quote those exactly, and explain them in plain words beside the quote.

**Out of scope:** this addendum does not define non-functional requirements (performance, capacity, compatibility constraints). Whether an NFR item type is added is a separate system-vocabulary decision, taken outside this document.

---

## A1. Sentence structure rules

1.1 **One sentence = one job.** One sentence carries one action, one rule, or one fact. Never an action plus its exceptions plus a reference.

1.1.1 **Every line is a complete sentence, with a subject and a verb.** This holds inside table cells too, not only in prose. A cell is not an excuse for a fragment.

- **No verb-first fragments.** "Sign in to continue" reads as an order to the reader. Write "The user signs in to continue."
- **No headless clauses.** "Which leads to state 2" has no subject. Write "That choice leads to state 2."
- **No dropped subject.** "Shows the mismatch screen" hides who acts. Write "The system shows the mismatch screen."
- **Start with the actor,** then the verb, then the rest. (§A2.1)

Four forms are allowed to stay short, because they name something rather than state something:

1. A heading.
2. A quoted piece of on-screen copy, such as a button label.
3. A name or an ID in its own column — a state name, a term in the Glossary's left column, an actor, a `FR-` code.
4. A short list of quoted values, such as a `Tab:` line.

Everything else is a sentence, including every cell that explains, describes, or tells the reader what happens.

1.2 **Maximum sentence length: 20 words.** If it needs more, it is two sentences.

1.3 **Main point first, additions after.** Start with who does what. Put conditions, reasons, and details in following sentences — never pile them up before the main clause.

1.4 **Keep the actor and the verb together, near the start.** Never put a long description between the subject and its verb.

1.5 **No em-dash chains, no nested asides.** At most one dash or one parenthesis per sentence. A second aside becomes its own sentence.

1.6 **Cross-references (§) go at the end of a line, never mid-sentence.**

1.7 **If order matters, say so and number it.** Write "in this order:" followed by a numbered list. Never imply order through sentence flow.

1.8 **Lists replace woven sentences.** Three or more parallel facts, options, or conditions MUST become a numbered or bulleted list, one item per line.

1.9 **Paragraphs: maximum 4 sentences, one topic each.**

---

## A2. Word choice rules

2.1 **Active voice with a named actor.** Every requirement names who or what acts: "the system sends", "the user clicks".

2.2 **Verbs stay verbs — no frozen nouns (nominalizations).** "Verification of the account occurs on link activation" → "the system verifies the account when the user clicks the link."

2.3 **Maximum 3 nouns in a row.** Never stack nouns into chains.

2.4 **Say it positively. Never two negatives.**

2.5 **Plain verbs only:** checks, decides, shows, sends, creates, blocks, stores, opens, stops. **Banned:** weighing, leveraging, facilitates, utilizes, surfaces, speaks to, load-bearing, moot, carve-out (write "exception").

2.5.1 **"Resolve" is banned outright, in every form.** Search for **`resol`**, not `resolv` — the shorter stem is what catches "resolution". No FRD may contain `resolve`, `resolves`, `resolved`, `resolving`, `resolution`, or `unresolved` — not in a requirement, not in a table cell, not in a status label, and **not as a Glossary term**. Defining it does not rescue it. The word has 3 unrelated everyday meanings (decide, fix, and become clear), so a reader in their second language must guess which one applies every time.

Say what actually happens instead:

| Instead of… | Write |
| :---- | :---- |
| "the system resolves the invite link to a state" | "the system decides which state to show" |
| "the invitation resolves to Valid Invite" | "the invitation turns out to be a valid invite" |
| "the link resolves to 1 of 5 outcomes" | "the link gives 1 of 5 outcomes" |
| "state resolution" / "invitation resolution" | "the state decision" / "the invitation check" |
| "while the system resolves the invitation" | "while the system checks the invitation" |
| "OQ-3 is unresolved" / "this stays unresolved" | "OQ-3 is still open" / "nobody has decided this yet" |
| "Resolved 2026-08-07 — ANSWER: …" | "Answered 2026-08-07 — ANSWER: …" |
| "a resolved Source Conflict" | "a settled Source Conflict" |
| "Proposed resolution" (§19.1 column) | "Proposed answer" |

The same test applies to any other word carrying several everyday meanings. Pick the one plain verb that names the action, and use it everywhere.

2.6 **Banned vague words:** etc., and so on, as appropriate, if needed, as necessary, in a timely manner, properly, robust, seamless. If the list has more members, name them. If a condition exists, state it.

2.7 **No "and/or".** Write "either A or B", "both A and B", or make a list and say how many apply.

2.8 **No idioms, no metaphors, no humor** in requirement text.

2.9 **Numbers are digits, always with their unit:** "30 days", "1 hour", "12–64 characters".

2.10 **No Latin abbreviations.** Write "for example" not "e.g.".

---

## A3. Consistency rules (one thing, one name)

3.1 **Same word for the same thing, everywhere.** Elegant variation is a bug.

3.2 **Domain words are allowed only if the Glossary defines them.**

3.3 **Every abbreviation is spelled out at first use** and listed in the Glossary.

3.4 **Modal verbs have fixed meanings:**

- **must** = a requirement. The system has no choice.
- **may** = an allowed option.
- **never / must not** = forbidden.
- **should, could, might, will, shall** — banned in requirement text.

**Note on "shall":** most requirements-engineering literature (EARS, INCOSE, IEEE style) uses "shall" for requirements. We deliberately do not. "Shall" is legal-register English that non-native readers stumble on, and GOV.UK retired it for that reason. We keep the EARS _patterns_ but write them with "must". Also: some organizations use the shall/must split to classify functional vs non-functional requirements — our system classifies by item type code instead, so the verb never needs to carry classification.

3.5 **Present tense.** "The system sends", not "the system will send".

3.6 **No bare "this", "it", "these" starting a sentence.**

3.7 **One word must never hide two behaviors.** If a word covers different mechanisms in different cases, spell out each case.

---

## A4. Explanation rules (for the non-technical reader)

4.1 **Every section opens with one plain sentence saying what the section tells you.**

4.2 **Fact first, reasoning second.**

4.3 **Every rule with a number gets a worked example** with realistic values, in italics.

4.4 **Every named state or screen gets one plain-language line** the first time it appears.

4.5 **Given before new.** Start sentences with what the reader already knows; put the new information at the end.

4.6 **The heavy part goes last.**

---

## A5. Functional Requirements (§7) — mandatory FR format

Every FR's Requirement cell follows this structure. Keep the ID and all existing columns exactly as before.

The TRIGGER field has **three forms**, following the EARS requirement patterns. Every FR uses the form that matches its nature — and this also classifies the FR:

```
TITLE: one line, max 12 words, what the system does.

TRIGGER — exactly one of these three forms:
  WHEN <event>          → event-driven: something happens, system responds.
  WHILE <state>         → state-driven: behavior active during a state.
  IF <failure> THEN     → unwanted behavior: errors, misuse, edge cases.
  (An FR with no trigger line at all is "ubiquitous": always true.
   Most of those belong in §8 as Business Rules instead.)

BEHAVIOR: what the system must do, in plain words.

CONDITIONS: if the behavior depends on more than one check, list each
  check as its own numbered line. If order matters, write "in this
  order" and number them in that order. Each numbered line must work
  as one test condition on its own.

WHY (optional): one sentence of reasoning or context.
  WHY lines are context only. They are NEVER a requirement, are NEVER
  tested, and no CONDITIONS may hide inside them. If a WHY sentence
  contains the word "must", it is in the wrong field.

EXAMPLE: one concrete example with realistic values, in italics.
```

**Clause-order rule (from EARS):** when an FR needs more than one trigger clause, the order is always **WHILE → WHEN → IF/THEN** (state first, then event, then failure). Never another order.
_Example: "WHILE a detach request is pending, WHEN the user opens the invite link, the system must show the pending-request state."_

**Example in the format (real FR-1):**

> **Decide which state an invite link must show**
> WHEN an invited user opens an invite link, the system decides which one of the 12 states to show. (§9.1)
> It checks four things, in this order:
>
> 1. The invitation itself — still open? If expired, declined, or broken, stop and show that terminal state.
> 2. Attachment — is the invited email already attached to a different organization? (§9.2)
> 3. Existing account — does an account already exist for the invited email?
> 4. Sign-in — is the invited user signed in, and with which email?
>    _Example: invitation open + no account + not signed in → "Valid Invite"._

**Example of the IF–THEN form (real FR-24):**

> **Report the specific invite failure during OAuth**
> IF the invitation is expired, already used, or invalid when an OAuth signup returns, THEN the system must show that specific reason — never a generic error.
> WHY: a user who sees "something went wrong" cannot know whether to ask for a new invite or give up.
> _Example: invite expired on July 1; Google signup returns July 3 → "This invitation has expired" — not "Login failed"._

---

## A6. Business Rules (§8) — mandatory rule format

```
THE RULE: one short sentence stating the rule as an always-true fact.
WHY: one sentence, only if the reason is not obvious.
EXCEPTION: if another rule overrides this one, name that rule ID on its
  own line. Never bury an exception mid-paragraph.
EXAMPLE: one concrete case, in italics, whenever the rule contains a
  number or a time window.
```

**Note:** a Business Rule is the "ubiquitous" EARS pattern — always true, no trigger. If a §7 FR turns out to have no trigger at all, consider whether it is really a Business Rule and belongs here.

---

## A7. Acceptance Criteria (§14)

7.1 Each Given, When, and Then cell holds one condition each.

7.2 Use the exact same words as the FR it verifies — never a synonym.

7.3 If an AC covers a positive and a negative path, write two labeled lines: "Blocked path: …" and "Success path: …".

7.4 An FR written in the IF–THEN (unwanted behavior) form must have at least one AC whose Given/When describes the failure condition — the negative path is never left untested.

---

## A8. Assumptions (§5.1)

```
THE ASSUMPTION: one sentence stating what is assumed true.
SOURCE: where it came from (document, team discussion, platform standard).
IF WRONG: one sentence on what breaks if this assumption fails.
```

---

## A9. Open Questions (§19.2)

Write the question as a real question a person would ask out loud. When it is answered:

```
Answered <date> — ANSWER: <the answer in one or two plain sentences.>
SOURCE: <what settled it.>
LEFT OPEN: <any narrower question carried forward, with its new ID.>
```

---

## A10. Prose sections (§2, §6, §9, §13, §17)

10.1 Steps are numbered actions, one action per number.

10.2 Bold the actor or the key fact at the start of a step.

10.3 Risk rows (§17): maximum three sentences per Notes cell.

10.4 A requirement never appears for the first time inside prose.

---

## A11. Revision History (§18)

Keep the house format and the ID-citing discipline. Every version entry starts with a plain-language summary line, maximum 25 words, before the detailed breakdown.

---

## A12. Final self-check before the FRD is finished

Run this checklist over the whole document. Fix every failure before output:

**Structure**

- [ ] No sentence over 20 words in the requirement, rule, AC, assumption, and open-question sections.
- [ ] Every FR has TITLE / TRIGGER / BEHAVIOR / CONDITIONS / EXAMPLE.
- [ ] Every CONDITIONS line works as a standalone test condition.
- [ ] Every ordered process says "in this order" with a numbered list.
- [ ] Three or more parallel facts are always a list, never a sentence.
- [ ] No cross-reference (§) mid-sentence. No second aside in a sentence.

**Words**

- [ ] Every requirement sentence has a named actor and an active verb.
- [ ] No nominalization. No noun chain over 3 nouns.
- [ ] No double negative. No "and/or". No "should" or "shall". No banned or vague word.
- [ ] The document contains no form of "resolve" — search for **`resol`** and expect 0 hits. (§A2.5.1) Searching `resolv` alone misses "resolution", which has no *v*.
- [ ] Every line is a complete sentence with a subject and a verb, inside table cells as well as in prose. (§A1.1.1)
- [ ] Every number is in digits, with its unit, and appears in at least one worked example.

**Consistency**

- [ ] One name per thing across the whole document (spot-check 5 terms).
- [ ] Every abbreviation spelled out at first use and in the Glossary.
- [ ] must / may / must not used with their fixed meanings only.
- [ ] No sentence starts with a bare "This" or "It".
- [ ] No word hides two behaviors (the "locked" test).

**Patterns**

- [ ] Every FR trigger uses exactly one form: WHEN, WHILE, or IF–THEN.
- [ ] Multi-clause triggers follow the order WHILE → WHEN → IF/THEN.
- [ ] No WHY line contains "must", a condition, or anything testable.

**Lovable Reference column (§7.1, §7.2, §9.x, §19.2)**

- [ ] Every FR row, every §9 state row, and every Open Question row has a non-empty cell — a route bullet, or the `None — no prototype surface` form with a reason.
- [ ] Every route in every cell is a markdown link, and every link target starts with the §1 Lovable base URL.
- [ ] Every cell is a bullet list. Route bullets start with `- `; detail lines do not.
- [ ] Detail lines use only `Tab:`, `Control:`, `Query:`, `Note:`, in that order, one fact per line.
- [ ] No tab name, control label, or query string is inside a link.
- [ ] No `Tab:` line names more than 5 states, and no cell holds more than 3 route bullets.
- [ ] Every route string traces back to the lovable FRD or a source worksheet — none invented.
- [ ] Every detail line reads as plain words: no noun chain over 3 nouns, no jargon fragment, 20 words or fewer.
- [ ] `Tab:`, `Control:`, and `Query:` lines only name the thing — every explanation sits on its own `Note:` line.

**The reader test**

- [ ] Every section opens with a one-line plain summary.
- [ ] Every exception sits on its own line naming the overriding rule.
- [ ] A non-technical reader could read any single FR or BR once, out of context, and correctly say what the system does.
- [ ] A new QA engineer could write test cases from §7 + §8 alone, without reading §6 first.
