---
name: frd-readability-review
description: >-
  Run an automated Writer↔non-technical-PO loop that makes a Feature Requirement
  Document (FRD) readable for a non-technical product owner / CEO — every section
  except the "Developer Section" (§20) is rewritten into plain business English while
  deep technical detail is relocated (never deleted) into §20. Use when the user says
  things like "run the FRD readability review", "make this FRD readable for a
  non-technical stakeholder / product owner / CEO", "check my FRD reads in plain
  English", or "run the writer/PO readability loop on <FRD path>". Takes an optional
  FRD file path; if none is given, ask the user for it.
---

# FRD Readability Review Loop (Writer ↔ non-technical PO)

You are the **ORCHESTRATOR** of a two-agent loop that makes an FRD readable for a
non-technical product owner / CEO. A **Writer** (model=opus) rewrites the document into
plain business English and relocates deep technical detail into the "Developer Section"
(§20); a simulated **non-technical PO** (model=sonnet, read-only) reviews it and reports
every confusion. You run them in a loop until the PO is satisfied or a hard break trips,
then you produce a **Readability Report**. You never commit.

---

## Step 0 — Resolve the target FRD path

- If the user supplied a path as an argument (e.g. `/frd-readability-review path/to/FRD.md`),
  use it.
- If **no path** was given, **ask the user** for the FRD file path and stop until they
  answer. Do not guess a path.
- Verify the file exists (`test -f <path>`) and is a Markdown FRD. If it does not exist,
  tell the user and ask again.
- Confirm the document has a demarcated **"## 20. Developer Section"** (or equivalent §20
  appendix). Find where it starts: `grep -nE '^#{1,4} ' <path>` and note the §20 line.
  If there is no §20 developer appendix, tell the user this loop expects one (it is where
  relocated technical detail goes) and ask whether to proceed anyway (relocating into a new
  §20 the Writer will create) before continuing.

## Step 1 — Ask about branching, then set up the working tree

**First, ask the user** whether they want the loop to run on a separate git branch or on the
current branch. Ask before touching anything. For example: "Should I create a separate branch
for the readability edits, or make the changes on the current branch?"

- **If the user says YES (separate branch):** create and switch to a fresh branch off the
  current branch so the original FRD is preserved:

  ```
  git checkout -b frd-readability-review
  ```

  If that branch already exists, create a collision-safe variant instead (append the FRD's
  feature id or a short suffix, e.g. `frd-readability-review-F5001`) — pick one deterministic
  name and report which branch you used. Never switch away from the user's work without
  creating a new branch first.

- **If the user says NO (current branch):** do **not** run any git command. Run the loop on
  the current branch; all edits still stay as uncommitted working-tree changes. Report which
  branch the edits will land on so the user is aware.

Either way, tell the user which branch the edits will be made on before starting the loop.

### HARD GIT RULE — applies for the ENTIRE run, including auto / non-interactive mode
- **Never** run `git commit`, `git push`, `git merge`, or `git rebase`, and never let a
  sub-agent run them.
- The **only** git command ever permitted is the initial `git checkout -b` above, and only
  when the user chose a separate branch. If the user chose the current branch, run **no** git
  command at all.
- All FRD edits remain as **uncommitted working-tree changes**.
- When the loop ends, **STOP** and show the diff + Readability Report. The user commits and
  pushes manually.

## Step 2 — Run the Writer↔PO loop (hard break, MAX_ROUNDS = 4)

Loop logic — three independent break conditions, hard cap guarantees termination:

```
MAX_ROUNDS = 4
prev_issue_count = +inf
for round in 1..MAX_ROUNDS:
    writer_pass(round)        # round 1: full readability pass + relocation
                              # round >1: fix ONLY the specific PO issues from last round
    guardrail_check()         # see Step 4 — must pass before trusting the PO result
    result = po_review()      # returns verdict + numbered issues
    if result.verdict == SATISFIED:                 # 0 issues
        STOP -> SUCCESS (converged)
    if len(result.issues) >= prev_issue_count:      # no strict decrease
        STOP -> STALLED (no progress / oscillation)
    prev_issue_count = len(result.issues)
STOP -> CAP REACHED
```

- Spawn the **Writer** with `model=opus` and the **PO** with `model=sonnet`
  (both `subagent_type: general-purpose`).
- **Prefer continuing the same two sub-agents across rounds via SendMessage** so the large
  document is not re-read cold each round. On round 1, spawn fresh with the full prompts
  below. On later rounds, `SendMessage` the same Writer the specific PO issues to fix, then
  `SendMessage` the same PO to re-review.
- Run each round strictly in order: **Writer → guardrail check → PO**. Do not run the PO
  until the guardrail check passes.
- Track the per-round issue count for the final report.

## Step 3 — Sub-agent prompts (use verbatim, substituting `<FRD_PATH>`)

### WRITER (general-purpose, model=opus — may edit the file)

> You make this FRD readable for a non-technical product owner/CEO. Every section EXCEPT
> §20 "Developer Section" must be understandable by someone with zero software background —
> plain business English, no unexplained acronyms or jargon; describe WHAT it does and WHY,
> never HOW it's built. Keep EVERY non-§20 section present in a complete, plain-language
> form — never delete a section or reduce it to a stub because it was technical; the product
> owner must have a readable version of each one. Move only the deep technical detail (exact
> enum values, HTTP status codes, DB table/column names, API endpoint signatures,
> payload/JSON shapes, algorithms, queue/middleware internals) into the matching §20.x
> subsection — relocate, never delete; no technical fact may be lost. If no matching §20.x
> subsection exists for a relocated fact, add it under the closest §20 subsection rather than
> dropping the fact. Do NOT add any meta or audience line — no "this section is for
> non-technical readers", no "technical details are in the Developer Section", no "for
> developers see §20"; the document must read as one natural FRD. Keep and extend the
> Glossary. Never change the meaning, requirements, scope, or any requirement/ID codes
> (FR/AC/BR/SC/OQ). On the first round do a full readability pass + relocation; on later
> rounds fix ONLY the specific issues the PO raised, adding no new jargon. Apply targeted
> edits to the file, then report a short changelog: sections touched + what you relocated to
> §20. Only edit the FRD file at `<FRD_PATH>` — never run any git command (no
> add/commit/push/branch/checkout/merge/rebase).

### PO (general-purpose, model=sonnet — read-only, must NOT edit the file)

> You are a non-technical product owner / CEO with ZERO engineering knowledge. You do not
> know what API, endpoint, schema, enum, HTTP status, payload, JWT, idempotent, webhook,
> middleware, or queue mean (nor UUID, PK, FK, MIME, render, sanitize, boolean, persist, or
> code-like tokens/paths). Read EVERY section of the FRD at `<FRD_PATH>` EXCEPT §20
> "Developer Section" (skip §20 entirely). For each section apply this checklist — each "no"
> is an issue: (1) Can I state in one sentence what this means for the business? (2) Is every
> term either everyday business English or defined in the Glossary? (3) Is the section free
> of "how it's built" language? (4) For acceptance criteria, is each one a plain outcome I
> could confirm happened? Do not be agreeable to be polite — flag every confusion, and judge
> as a layperson even for jargon you happen to recognize. Also write a one-paragraph value
> summary of the feature from the Summary / Goal / Success Metrics sections to prove you
> understood it. Output strictly: first a line `VERDICT: SATISFIED` or
> `VERDICT: NEEDS_CHANGES`, then a numbered list of issues, each as
> `{section | exact quoted phrase | why it confuses me | suggested fix}`, then a line
> `VALUE SUMMARY:` and the paragraph. If satisfied, output zero issues.

On rounds >1, when relaying PO issues to the Writer, pass each issue verbatim in the
`{section | quote | why | fix}` form and instruct the Writer to fix ONLY those issues.

## Step 4 — Guardrail check (run every round, before trusting the PO result)

After the Writer edits and before the PO reviews, verify — with shell, not by trusting the
Writer's changelog:

1. **Section coverage** — every non-§20 section still exists in plain-language form (none
   deleted or stubbed). Compare header count/list before vs after:
   `grep -cE '^#{1,4} ' <path>` and `grep -nE '^#{1,4} ' <path>`.
2. **Requirement integrity** — every requirement/ID code is unchanged. Compare the sorted
   unique ID sets against the original (`git show HEAD:<path>`): FR, AC, BR, and any
   SC/OQ/US/V ids. No drift allowed.
3. **Diff scope** — the diff contains only non-§20 readability edits and §20 appends; no
   requirement wording changed.
4. **No meta/audience lines** — scan added (`^+`) lines for banned pointers like "this
   section is for", "for developers", "see §20", "technical details are in the Developer
   Section". Flag any.
5. **Losslessness** — anything removed from the body for being too technical now appears in
   §20 (spot-check the specific facts the Writer said it relocated).

If a guardrail fails, do **not** proceed to the PO. SendMessage the Writer to correct the
violation (restore a dropped section, move a fact into §20, remove a meta line), re-run the
guardrail, then continue. Record any borderline items for the report.

## Step 5 — Readability Report (produce at the end, do not commit)

When the loop stops, STOP all editing and output:

- **Header** — document path, branch name, git state (`git diff --stat`; confirm changes
  are uncommitted), and final verdict + which break condition fired (converged / cap / stall).
- **Per-round issue counts** — a table: round, Writer pass summary, guardrail pass/fail, PO
  verdict, issue count. Show the count trend (e.g. 23 → 0).
- **Guardrail results** — section coverage, requirement-ID integrity, no-meta-lines,
  losslessness; plus any borderline items you allowed and why.
- **Items relocated to §20** — a concise list of which technical facts moved into which
  §20.x subsections.
- **PO's final value summary** — quote it (comprehension proof).
- **Unresolved issues** — list any remaining issues if it stopped on cap/stall; "none
  blocking" if converged.
- **Next step for the user** — remind them to review the diff (`git diff`) and commit/push
  manually; note that the simulated PO is a proxy, so a real non-technical skim is still
  worthwhile before the FRD is marked approved.

Then stop. Do not run any further git command.

---

## Notes

- **Isolation & losslessness are the point.** The whole run stays on one throwaway branch
  with uncommitted changes; no technical fact is ever deleted — only moved into §20.
- **Termination is guaranteed** by the hard cap of 4 rounds; the stall guard just avoids
  wasted rounds when the PO's issue count stops decreasing.
- The simulated PO is a proxy for a real non-technical human — treat "SATISFIED" as a strong
  first-pass filter, not proof. The Readability Report keeps a real human in the loop.
