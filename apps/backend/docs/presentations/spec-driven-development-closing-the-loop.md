# Spec-Driven Development: Closing the Loop
### Presentation outline for Management / CTO

> **How to use this file:** Each `## Slide N` block is one slide. The bullets are the on-screen content (keep them short). The **Speaker notes** are what you say out loud — paste them into the notes pane in PowerPoint / Google Slides. Suggested length: ~16 slides, ~15–20 minutes.

---

## Slide 1 — Title

**Spec-Driven Development: Closing the Loop**

Making AI-generated code trustworthy, traceable, and self-correcting

- Starter Platform · Backend Engineering
- 2026-06-09

> **Speaker notes:** Today I want to show you a system we've built around *how* we turn requirements into shipped software — not a feature, but the development process itself. The headline: we've made our specifications and our code keep each other honest, automatically. This matters because our pipeline is AI-assisted end to end, and specs are what keep AI-generated code correct. I'll show the problem, the fix, and proof it works on a real feature.

---

## Slide 2 — Executive Summary (the one slide that stands alone)

- We already practice **spec-driven development**: every feature flows through a chain of reviewed documents before and during coding.
- We found a structural gap: specs were **written once, then frozen** while code moved on — so docs quietly became wrong.
- We closed the loop with **three additions**: a reconciliation step, a "one-source-of-truth-per-fact" rule, and an **automated drift check that blocks bad merges**.
- Proven on a live feature — two real documentation bugs are now **impossible to reintroduce**.
- **Cost: near zero.** Built on existing tooling. No new vendors, no new infrastructure.

> **Speaker notes:** If you remember one slide, this is it. We didn't buy anything or rebuild anything. We added a feedback loop and an automated guardrail to a process we already follow. The payoff is that our documentation now matches our code by construction, which de-risks everything downstream — QA, onboarding, support, audits, and especially AI-assisted code generation.

---

## Slide 3 — Strategic Context: Specs Are the Control Plane

- Our development pipeline is **AI-assisted at every stage** — requirements, design, issues, code, tests, docs.
- AI agents generate work by **reading the specs**. Garbage spec in → garbage code out.
- Therefore: **spec accuracy is the single biggest lever** on AI-generated code quality.
- A spec that lies isn't a documentation problem — it's a **defect factory**.

> **Speaker notes:** This is the "why should the CTO care" slide. As we lean into AI-assisted engineering to increase throughput, the specifications become the control plane — they're the instructions the AI follows. If the spec drifts from reality, every AI agent downstream amplifies the error: it designs, codes, tests, and documents against a false premise. So investing in spec correctness isn't bureaucracy; it's the highest-leverage quality investment we can make in an AI-native shop. Everything that follows is about protecting that control plane.

---

## Slide 4 — What We Already Do Well

- Every feature passes through a **reviewed document chain**, each with a codified authoring guide:

  `Product input → Lovable-FRD → FRD → TDD → Issues → Code → Tech-docs → Tests → Swagger`

- **Human approval gate** before build (Product + QA + Engineering sign off the FRD).
- Business *what* and technical *how* are deliberately **kept in separate documents**.

> **Speaker notes:** Start from strength — this is not a turnaround story. Most teams that claim spec-driven development have a single requirements doc and then improvise. We have a genuine refinement chain: product intent becomes a UI-faithful FRD, then a backend FRD, then a technical design, then GitHub issues, then code, then docs and tests — and each transition has a written instruction guide an engineer or AI agent follows. There's an explicit sign-off gate before any code is written. This is already above industry norm. The gap I'm about to describe is the *one* missing piece, not a rebuild.

---

## Slide 5 — The Problem: Specs Freeze, Code Moves On

- The document chain only flows **one direction: downward.**
- Once code is written, **nothing flows back up** to correct the specs.
- The moment implementation discovers a new truth, the upstream specs **start lying** — silently.
- Symptom we coined internally: **"spec written once, then frozen."**

> **Speaker notes:** Here's the structural flaw. Our pipeline is a straight line pointing down: intent → spec → design → code. But real implementation *always* discovers things the design didn't anticipate — an extra state, a stricter validation rule, a renamed field. In a one-directional pipeline there is no step whose job is to push that discovered truth back up into the specs. So the specs freeze at "design time" while the code keeps evolving. Nobody is doing anything wrong — the flaw is in the *shape* of the process. This is literally the definition of waterfall, just with nicer documents.

---

## Slide 6 — Why It Happens: Open-Loop vs Closed-Loop

| | Open-loop (before) | Closed-loop (after) |
|---|---|---|
| Direction | One way, down | Loop — truth flows back up |
| Drift | Accumulates silently | Detected & reconciled |
| Source of truth | Duplicated in 3+ docs | One owner per fact |
| Enforcement | Human discipline | Automated gate |

> **Speaker notes:** The distinction between open-loop and closed-loop is the whole talk in one frame. An open-loop system has no feedback, so errors accumulate undetected. A closed-loop system measures its own output and corrects. We were open-loop. The fix is to add the feedback edge — a reconciliation step — plus a rule that stops the same fact being written in multiple places (which is what makes drift possible), plus automation so the correction doesn't depend on someone remembering. I'll take each of these in turn.

---

## Slide 7 — The Cost of Drift (in business terms)

- **Engineers** build against stale specs → rework.
- **QA** tests behavior the system no longer has → false failures / missed bugs.
- **Support** answers from wrong docs → bad customer outcomes.
- **AI agents** generate code from a false premise → defects at scale.
- **Audit / compliance** can't trust the paper trail → risk.

> **Speaker notes:** Drift isn't abstract — it has a per-role cost. An engineer who trusts a stale spec builds the wrong thing and reworks it. QA writes tests against documented behavior that no longer exists. Support reads a doc that contradicts the product. And in our AI-assisted flow, an agent that reads a drifted spec confidently generates wrong code, wrong tests, and wrong docs — error amplification. Finally, for any compliance or due-diligence conversation, "our docs match our code" is a statement we want to be able to make truthfully. Drift quietly erodes all of these.

---

## Slide 8 — Case Study: The Invitations Feature

What we found when we checked specs against the actual code:

- A persisted state — `queued` — existed in the **database and code** but was **missing from the FRD**. It had been written in **three** places and they'd diverged.
- A validation rule was **documented as 1 condition** but the code enforced **3**.
- The feature had **5 live API endpoints** and **0 API documentation**.
- Repo-wide scan: **14 modules** with undocumented endpoints.

> **Speaker notes:** This is the proof that the problem is real, not theoretical. We took one mature, shipped feature — user invitations — and diffed its specs against its code. We found a whole state in the state machine that the business spec never mentioned, because that state was hand-typed into three different documents that then drifted apart. We found a validation rule the doc under-described. We found five working endpoints with zero API docs. And when we scanned the whole backend, fourteen modules had the same undocumented-endpoint gap. None of this was caught by code review, because code review checks code, not whether the spec still matches it. That's exactly the blind spot a closed loop fixes.

---

## Slide 9 — The Solution: Three Mechanisms

1. **Spec Sync** — a named reconciliation step that pushes implementation truth back up into the specs.
2. **One source of truth per fact** — each fact has a single owning document; everyone else *references* it instead of copying it.
3. **Automated drift detection** — a check that **blocks merges** introducing new drift.

> **Speaker notes:** The fix is three complementary pieces. The first adds the missing feedback edge — a reconciliation pass after code lands. The second removes the *cause* of drift: the same fact being maintained in multiple documents that then diverge — we assign every fact one owner. The third makes it self-enforcing: an automated check in our CI pipeline that fails the build if someone adds an endpoint without docs, or a state without updating its spec. Discipline doesn't scale; automation does. Let me show each.

---

## Slide 10 — Mechanism 1: Spec Sync (the feedback edge)

- A documented step that runs **after code is written** and before merge.
- Reads the **actual code**, diffs it against the FRD / design / issues.
- Patches the specs to match reality; flags genuine product disagreements for a decision.
- Every doc gets a **"Last reconciled against implementation"** stamp — staleness becomes visible.

> **Speaker notes:** Spec Sync is the new step 11 in our pipeline — the arrow that points back up. It's a checklist-driven pass: read the schema, the routes, the validation rules as they actually exist in code, and reconcile the documents to them. Crucially, if the code and an *approved* spec genuinely disagree about intended behavior, that's not silently overwritten — it's raised as a product decision. And every reconciled document carries a date stamp, so anyone can see at a glance whether a spec has been checked against the code recently. "Last reconciled: never" is now a visible signal.

---

## Slide 11 — Mechanism 2: One Source of Truth per Fact

- Drift happens when the **same fact lives in many documents** and they diverge.
- Fix: assign each fact **one owning artifact**; everything else links to it.

| Fact | Owner |
|---|---|
| Business rules, acceptance criteria | The FRD |
| Database schema, endpoints, states | The **code** |
| Validation rules, error messages | The **code / constants** |
| Design decisions ("why") | The ADR |

> **Speaker notes:** This is the root-cause fix. The `queued` state drifted *because* it was authored in three places. The cure isn't "sync harder," it's "stop duplicating." We declared, in our authoring guides, who owns each category of fact. Business rules live in the functional spec. But things that live in code — the database schema, the list of endpoints, the exact validation rules — are *owned by the code*, and the documents reference them rather than re-typing them. You can't have a divergence between two copies if there's only one copy. This rule is now baked into the FRD and technical-design authoring guides so future documents follow it by default.

---

## Slide 12 — Mechanism 3: Automated Drift Detection (the ratchet)

- A check, wired into **CI**, that runs on every backend change:
  - **Endpoint without docs** → fails the build.
  - **State in code missing from its spec** → fails the build.
- Existing debt is **grandfathered as a tracked burn-down list** — *new* drift is blocked immediately.
- Also runs locally as a **non-blocking warning** before commit.

> **Speaker notes:** This is what makes the whole thing self-enforcing rather than dependent on someone remembering. It's a small script in our continuous-integration pipeline. If you add an API endpoint without documentation, or add a new state to the code without updating its spec, the build goes red and the merge is blocked. We used the standard "ratchet" approach: the fourteen pre-existing offenders are recorded as an explicit, visible burn-down list so we don't break the current build — but any *new* drift fails instantly. So the situation can only improve from here, never regress. Developers also get a friendly heads-up locally before they even commit. The system now polices itself.

---

## Slide 13 — Proof: It Works

| Scenario | Result |
|---|---|
| New undocumented endpoint (CI) | ❌ Build blocked |
| Missing state in spec | ❌ Build blocked |
| Local pre-commit, drift present | ⚠️ Warns, doesn't block |
| Current state of fixed feature | ✅ Passes clean |

- Both real bugs from the case study are now **machine-impossible to reintroduce.**

> **Speaker notes:** We didn't just write this — we verified it under real conditions. We confirmed that introducing a new undocumented endpoint fails CI, that a missing state fails CI, that the local check warns without blocking the developer, and that the now-fixed invitations feature passes clean. The two specific bugs we found at the start — the missing `queued` state and the five undocumented endpoints — would now both trip the automated gate. They cannot silently come back. That's the difference between fixing a bug and fixing the *class* of bug.

---

## Slide 14 — Business Value

- **Less rework** — engineers and QA build against specs that are true.
- **Trustworthy AI output** — accurate specs → correct AI-generated code, at scale.
- **Faster onboarding** — new hires can trust the docs.
- **Audit-ready** — "our docs match our code" is now a defensible claim.
- **Quality by construction** — guaranteed by automation, not heroics.

> **Speaker notes:** Tie it back to outcomes the business cares about. Rework is the most expensive thing in engineering and drift is a silent driver of it — this cuts it. As we scale AI-assisted development, this is what keeps the AI's output correct, which is the difference between AI being a force multiplier and AI being a liability multiplier. New engineers ramp faster when the documentation is reliable. For any investor, customer, or compliance review, we can now truthfully say our specifications track our implementation. And critically, this quality is enforced by the pipeline, so it doesn't degrade the moment people get busy.

---

## Slide 15 — Cost, Rollout & What's Next

- **Build cost:** effectively zero — existing tooling, no new infrastructure or vendors.
- **Live now:** reconciliation step, source-of-truth rules in the authoring guides, CI drift gate.
- **Tracked backlog (surfaced by the system itself):**
  - 14 modules to document — a managed burn-down list.
  - Unrelated pre-existing build errors to clean up.

> **Speaker notes:** On cost — this was built on tools we already pay for: our test runner, our git hooks, our existing CI. No procurement, no new headcount, no infrastructure. It's already running. What's left is backlog, and importantly that backlog was *surfaced by the new system* — the fourteen undocumented modules were invisible before; now they're an explicit, prioritized list we can burn down. That's the system working as intended: it made our hidden documentation debt visible and measurable. The pre-existing build errors are a separate, unrelated cleanup we noted along the way.

---

## Slide 16 — Recommendation / The Ask

- **Adopt the closed-loop process as standard** for backend features.
- **Endorse the burn-down** of the 14 documented-debt modules over upcoming sprints.
- **Extend the pattern** to frontend and admin pipelines next.
- Optional: make the drift gate a **required check** on protected branches.

> **Speaker notes:** What I'm asking for: first, bless this as the default way we build backend features — it already is technically, I want it to be official. Second, support allocating a bit of sprint capacity to burn down the fourteen-module documentation debt the system surfaced. Third, the same closed-loop pattern applies to our frontend and admin codebases — I'd like to extend it there. And optionally, we can flip the drift check to a *required* status check on our protected branches so it can't be bypassed. None of this needs budget — it needs endorsement and a little prioritization. Happy to take questions.

---

## Appendix A — The Pipeline, End to End

```
1.  Product input: Lovable routes + workflow spreadsheet
2.  Lovable-FRD        (UI-faithful functional spec)
3.  FRD                (business/backend contract)   ──► review gate: Product + QA + Eng
4.  TDD                (technical design)
5.  GitHub issues
6.  Code + review
7.  Runtime tech-docs + ADRs
8.  Integration tests
9.  E2E tests (Playwright)
10. Swagger / API docs
►► 11. SPEC SYNC ◄◄    reconcile specs to code  +  automated drift gate (CI)
```

> **Speaker notes:** Keep this in your back pocket for the "show me the whole process" question. Steps 1–10 are the existing pipeline; step 11 — Spec Sync plus the automated gate — is the closed-loop addition. The loop is the difference between "we wrote specs once" and "our specs stay true."

---

## Appendix B — Glossary (for non-engineers in the room)

| Term | Plain meaning |
|---|---|
| FRD | Functional Requirements Document — *what* we're building and why |
| TDD | Technical Design Document — *how* we'll build it |
| ADR | Architecture Decision Record — a logged "why we chose X" |
| Spec drift | Documents and code disagreeing over time |
| CI gate | An automated check that can block a code merge |
| Swagger / OpenAPI | The standard format for API documentation |
| Ratchet | Block *new* problems while burning down existing ones |

> **Speaker notes:** Use this if management asks "what's an FRD" mid-talk — point at the glossary and keep moving.
