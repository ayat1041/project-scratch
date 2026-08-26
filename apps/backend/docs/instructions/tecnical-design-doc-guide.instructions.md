# Technical Design Generation Instruction

Use this instruction whenever you need to generate a lightweight but engineering-ready Technical Design Document (TDD) from an approved or near-final Feature Requirement Document (FRD).

## Purpose

Create a Technical Design Document that translates the FRD into an implementation plan for backend, frontend, QA, and DevOps without mixing business requirements back into the design.

The Technical Design Document must answer:

- how the feature will be built
- what data model changes are needed
- what APIs or integrations are needed
- what service boundaries and flows are involved
- what technical decisions are still open
- what risks, rollout needs, and testing strategy should be considered before development starts

## When to use this

Use this instruction when:

- an FRD already exists
- business rules and acceptance criteria are mostly stable
- engineering needs to decide tables, endpoints, flows, and implementation shape
- GitHub issues are about to be created
- API contracts, migrations, and system interactions need alignment

Do not use this instruction as a replacement for the FRD.

## Input prerequisites

The following inputs should be gathered if available:

- approved or draft FRD
- UI/prototype references
- current architecture constraints
- stack details
- existing entities/tables/services
- backend API workflow conventions (`apps/backend/docs/instructions/api-workflow.instructions.md`)
- auth/session model
- third-party integrations
- deployment context
- non-functional requirements
- rollout constraints

If any of these are missing, proceed with reasonable assumptions and list them explicitly.

## Output standard

The Technical Design Document must be written in markdown.

It should be implementation-oriented and specific enough that the team can:

- estimate work
- create GitHub issues
- start schema and API implementation
- prepare Swagger/OpenAPI specs
- define tests
- identify ADR-worthy decisions
- review operational risks before coding

## Writing principles

- Treat the FRD as the source of truth for business behavior.
- Do not restate the entire FRD unless needed for context.
- Convert requirements into concrete design decisions and options.
- Clearly distinguish decided items from assumptions and open technical questions.
- Prefer explicit tradeoffs over implicit choices.
- Be specific enough for implementation planning, but avoid unnecessary overdesign.
- Call out where ADRs are recommended.

### Readability rules

A TDD is read by a developer who has to build from it, usually in one sitting, usually under time pressure. These rules are not style preferences — a TDD that is exhausting to read gets skimmed, and a skimmed TDD produces the drift it was written to prevent.

**R1. One document, one job: describe the design.** Write every section in the present tense, as though the design is what exists — "the service re-checks eligibility", not "the service will re-check" or "the service does not yet re-check". Build state goes in **one** table near the top (§2), never inline in the design sections. A reader building §7.1.5 should not have to filter design from status line by line.

**R2. No archaeology.** Do not argue with earlier drafts of the document inside the document. "An earlier reading framed this as…", "that reasoning conflated two things…", "was documented as…" — all of it belongs in the revision history, or nowhere. Git holds the history; the reader needs the conclusion.

**R3. Plain words.** Banned outright: `carve-out` (write "exception"), `posture` (write "rule" or "approach"), `load-bearing` (say what actually depends on it), `anti-enumeration` (write "must not reveal whether a record exists"), `provenance`, `banding`, `high-water mark`, `purchased by`, `materialisation`. A term that appears nowhere else in the codebase forces the reader to learn a private dialect before they can read the design.

**R4. Cross-references must earn their place.** The test is whether the sentence still makes sense without the reference. If it does, the reference is decorative — drop it. Keep the ones a reader genuinely has to follow to act. Never point at the section you are already in.

As a smell check, count `§` and divide by word count. Below ~1 per 75 words, look for decorative refs; below ~1 per 40, the document is unreadable regardless of how good the design is. This is a signal, not a gate — a feature spanning two modules and four ADRs will legitimately reference more than a single-endpoint one.

**R5. Always say which document a `§` belongs to.** Write `FRD §9.1` for the FRD and a bare `§7.1.5` for this document. Never leave a reader guessing, including in chains: write `FRD §14.1 / FRD §14.2`, not `FRD §14.1 / §14.2`.

**R6. Keep table cells to one idea, and under ~70 words.** A cell running to a paragraph with three nested clauses and four cross-references is prose wearing a table's clothes. Split it, or move the reasoning to a short note under the table. A `>` note directly beneath a table is the right home for anything that needs a paragraph.

### Self-check before output

Run these over the finished document and fix every failure:

- [ ] Grep for `carve-out|posture|load-bearing|anti-enumeration|provenance|banding|high-water` — expect 0 hits. (R3)
- [ ] Count `§` and divide by word count — expect roughly 1 per 75 words or fewer. (R4)
- [ ] Every `§` is either prefixed `FRD ` or unambiguously this document. (R5)
- [ ] Build-status words (`not built`, `NEW`, `DRIFT`, `shipped`) appear in §2's status table and essentially nowhere else. (R1)
- [ ] No sentence describes what a previous version of this document said. (R2)
- [ ] No table cell exceeds ~70 words. (R6)
- [ ] Every heading number referenced by a `§` actually exists.

> **Worked example.** F2006's TDD and F2017's TDD cover comparable scope. F2006 ran 11.8k words with 76 cross-references and no private vocabulary. F2017's first version ran 21.5k words with 520 cross-references, 30 uses of "carve-out", and 94 inline status markers — same structure, same table density, and even *shorter* sentences, yet far harder to read. Sentence length was never the problem; R1, R3 and R4 were. Rewriting against these rules brought it to 12.9k words and 173 references with no design decision changed.

## Source of truth ownership

The TDD **proposes** schema, endpoints, and state transitions; it does **not own** them. Once implemented, code is the source of truth (schema → `db/schema`, routes → routes file, transitions → services/worker). Write this document as a concrete proposal, but expect §5–§7 to be reconciled against the implementation afterward — do not treat the TDD's first draft of a table or endpoint as the permanent record.

A design decision that the TDD's §15 marks as ADR-worthy should be promoted to an actual ADR **at design time** (before issues are created), not bolted on after coding. ADRs own the "why" and are the least drift-prone artifact — front-loading them is free durability. The FRD and TDD then link to the ADR rather than re-arguing the decision.

After code lands, run `spec-sync.instructions.md` to re-align §5 (state design), §6 (DB design), and §7 (API design) with what was actually built.

## What this document should cover

This document should cover, where relevant:

- architecture overview
- request/response flow
- DB design proposal
- endpoint design proposal
- auth and permission enforcement
- background jobs or asynchronous processing
- error handling strategy
- observability
- migration plan
- testing strategy
- rollout and rollback notes

## What this document should not do

- Do not rewrite business requirements as if this were another FRD.
- Do not include vague sections like “backend will handle validation.”
- Do not skip tradeoffs for important technical choices.
- Do not generate final code.
- Do not generate final Swagger/OpenAPI unless explicitly asked.
- Do not produce exact SQL migrations unless explicitly asked.
- Do not hide uncertainty; document it.

## Required document structure

Use the following template.

---

# Technical Design Document: <Feature Name>

## 1. Document Control

- **Feature Name:**
- **Related FRD:**
- **Owner:**
- **Authors:**
- **Reviewers:**
- **Version:**
- **Status:** Draft / In Review / Approved
- **Last Updated:**
- **Last reconciled against implementation:** <YYYY-MM-DD @ commit/branch, or "not yet implemented"> — see `spec-sync.instructions.md`
- **Related Artifacts:**
  - FRD
  - UI/prototype
  - ADRs
  - API docs
  - issue tracker epic

## 2. Context and Scope

### 2.1 Summary

Summarize the implementation goal in 2 to 5 sentences.

### 2.2 In Scope for Technical Design

List what this design covers technically.

### 2.3 Out of Scope for Technical Design

List what this design intentionally does not cover.

### 2.4 Key FRD References

Reference the parts of the FRD that drive this design. The FRD splits FRs, BRs, and ACs by layer (backend vs frontend); a backend TDD owns the **backend** scope, so list backend and frontend ID ranges separately and mark the frontend ones as cross-layer context only:

- business rules — backend (this TDD's scope) vs frontend (FRD §8.1 / §8.2)
- functional requirements — backend vs frontend FR ranges (FRD §7.1 / §7.2)
- acceptance criteria — backend (FRD §13.1), cross-cutting authz/permission/tenant (FRD §13.3, validated by API E2E), and frontend (FRD §13.2) AC IDs
- states
- data impact
- non-functional requirements
- traceability bridge — the FR/AC → layer → TDD section → issue mapping doc (e.g. `implementation-traceability-bridge.md`), so this TDD links to it instead of restating the matrix

## 3. Assumptions and Constraints

### 3.1 Assumptions

Document assumptions required to proceed.

### 3.2 Technical Constraints

Include relevant constraints such as:

- existing architecture
- framework limitations
- PostgreSQL capabilities
- Express middleware patterns
- established backend endpoint workflow and middleware ordering from `apps/backend/docs/instructions/api-workflow.instructions.md`
- VPS / Docker / Nginx deployment model
- auth/session mechanisms
- third-party integration behavior

## 4. Proposed Architecture

### 4.1 High-Level Design

Describe the components involved and how they interact.

Examples:

- frontend
- API layer
- service layer
- database
- background worker
- email provider
- OAuth provider
- audit/logging pipeline

### 4.2 Request / Event Flow

Describe the main runtime flows in numbered steps.

Use separate subsections for:

- happy path
- important alternate paths
- asynchronous flows
- failure/retry flows

### 4.3 Sequence Notes

Explain where validation, authorization, transactions, and side effects happen.

## 5. Domain Model and State Design

### 5.1 Core Entities

List the entities involved and their purpose.

### 5.2 State Model

Translate FRD states into technical design.

For each stateful entity, specify:

- persisted statuses
- computed statuses if any
- transition rules
- invalid transitions
- derived fields or computed flags

### 5.3 Invariants

List the conditions that must always remain true.

Examples:

- a user may hold only one primary role at a time
- only certain statuses are removable
- token must be unique and unguessable
- soft-deleted records must be excluded from default queries

## 6. Database Design Proposal

This section must be concrete.

For each table/entity:

### 6.1 <Table or Entity Name>

Include:

- purpose
- new or existing
- candidate columns and types
- nullable vs non-nullable expectations
- defaults
- relationships
- foreign keys
- uniqueness constraints
- indexes
- soft delete or hard delete behavior
- audit/event implications

### 6.2 Data Integrity Rules

Document:

- normalization rules
- case-insensitive comparisons
- partial unique index ideas
- transactional guarantees
- referential integrity requirements

### 6.3 Migration Considerations

Document:

- migration order
- backfill needs
- compatibility concerns
- production safety concerns
- rollback considerations

## 7. API Design Proposal

This section must be concrete enough for issue breakdown and later Swagger work.

For each endpoint:

### 7.1 <Endpoint Name>

Include:

- method
- route
- purpose
- auth requirements
- permission checks
- request shape
- response shape
- major validation rules
- main error codes
- idempotency expectations
- sync vs async behavior
- side effects
- observability notes

When the backend already has an established endpoint workflow, the TDD should align endpoint proposals with it rather than inventing a new route/controller/authorization shape.

Examples of alignment items to call out explicitly when relevant:

- middleware order and whether the route is expected to follow `isAuthenticated -> hasPermission -> resolveResources -> authorize -> controller`
- whether resource existence and ownership context should be derived through `resolveResources`
- whether a parent path parameter is actually required, or is redundant because a child resource ID can resolve ownership context directly
- whether bulk endpoints should use body ID arrays and flat routes consistent with existing backend conventions

### 7.2 Bulk vs Single-Item Actions

Clarify whether actions are:

- bulk endpoint
- repeated single-item endpoint
- async job-triggering endpoint

### 7.3 API Contract Notes

Document any:

- pagination
- filtering
- sorting
- status enums
- backward compatibility requirements
- versioning concerns

## 8. Validation, Authorization, and Security Design

### 8.1 Validation Strategy

Specify where validation happens:

- request validation
- service-level validation
- DB-level enforcement

### 8.2 Authorization Strategy

Specify:

- role checks
- tenant scoping
- ownership checks
- permission boundaries

If the codebase already defines a resolver/policy-based authorization workflow, the TDD should state how proposed routes map onto that workflow and what resource metadata must be resolved for authorization, such as `ownerId`, `userId`, and state fields.

### 8.3 Security Considerations

Include relevant items such as:

- token hashing/storage
- replay prevention
- rate limiting
- brute-force protection
- secret handling
- auditability
- PII handling

## 9. Background Jobs and External Integrations

### 9.1 Async Processing

List any background jobs, queues, retries, and dead-letter or fallback behavior.

### 9.2 External Services

For each integration, specify:

- provider/service
- purpose
- timeout/retry expectation
- failure behavior
- observability requirement

## 10. Error Handling and Operational Behavior

### 10.1 Error Model

List expected classes of errors:

- validation
- permission
- business rule conflict
- external dependency failure
- transient infrastructure failure

### 10.2 Recovery Strategy

Describe retries, compensating actions, and user-visible behavior.

### 10.3 Logging and Audit

Specify:

- log events
- structured fields
- correlation IDs
- audit events
- sensitive data redaction rules

## 11. Performance and Scalability Considerations

Include only what is relevant:

- expected data volume
- query/index considerations
- pagination strategy
- N+1 avoidance
- concurrency concerns
- batch size limitations
- caching, if applicable

## 12. Testing Strategy

This section must be specific, and it must **mirror the FRD's layer split and link every test entry to the AC(s) it validates and the backing FR(s)**. Separate tests by the boundary each one exercises — this distinction is load-bearing, not cosmetic:

- **§12.1 Unit / §12.2 Integration (Backend)** — own the FRD's backend ACs (§13.1). Integration tests run the service against a real DB/Redis **below the HTTP layer**, so they **bypass the middleware chain** (`isAuthenticated → hasPermission → resolveResources → authorize`). They prove business logic and persistence; they do **not** prove authentication, permissions, or tenant isolation.
- **§12.3 API E2E (Playwright)** — hits the live HTTP route through the full middleware chain. This is the **only** layer that proves the FRD §13.3 cross-cutting ACs: authentication (401), permission gating (403), tenant/ownership isolation (403/404), not-found (404), route-level status codes for invalid-state (409), and response-contract/security conformance. Whenever the feature has authenticated tenant-scoped endpoints, this sub-section is **mandatory** — its absence means authz/tenant isolation is unverified.
- **§12.4 UI E2E (Playwright)** — frontend user journeys; frontend ACs (§13.2) are owned by the frontend suite and appear only where a journey crosses them.
- **§12.5 Failure / Edge** and **§12.6 AC → Test matrix** close the section.

Annotate each bullet with `→ AC-X (FR-Y)` and, where relevant, the business rule it enforces (`enforces BR-Z`). Every test file header must carry the matching `AC-X` comment so coverage is grep-discoverable (`grep "AC-X" *.test.ts`).

### 12.1 Unit Tests (Backend)

List logic that should be unit tested, each linked to its AC/FR. Example: `Validation aggregation across all categories → AC-4 (FR-3, FR-4, FR-6)`.

### 12.2 Integration Tests (Backend)

List service/database flows that should be integration tested, each linked to its AC/FR. Note inline that these run below the HTTP layer and do not exercise auth/permission/tenant middleware (that is §12.3).

### 12.3 API E2E Tests (Playwright — Authorization, Permissions, Tenant Isolation)

Mandatory when the feature exposes authenticated, tenant-scoped endpoints. List concrete cases against the live API, grouped by guarantee, each linked to a §13.3 cross-cutting AC:

- **Authentication** — each endpoint without a session → 401 + error contract → AC-18; enforces the auth BR.
- **Tenant isolation** — tenant B targeting tenant A's resource id on each endpoint → 403/404; no disclosure → AC-19; enforces the scoping BR.
- **Permission gate** — user lacking the required permission per endpoint → 403 → AC-20.
- **Resource existence** — non-existent id for an authorized caller → 404 → AC-21.
- **Status codes & contract** — invalid-state transitions → 409; success/error bodies match the documented contract with no internal-field leak; malformed/malicious input → 4xx (never 500) → AC-22 (with the relevant transition ACs for the 409s).

### 12.4 UI E2E Tests (Cross-Layer User Journeys)

List frontend user journeys. Link each to the backend AC it validates end-to-end, and note in parentheses any frontend AC it *crosses* (owned by the frontend suite, not implemented here).

### 12.5 Failure and Edge-Case Tests

List, each linked to its AC/FR and any BR it enforces, tagged with the owning layer (Backend / API E2E):

- invalid state transitions (service guard → Backend; route 409 → API E2E)
- retries
- race conditions
- partial failure handling
- expired/invalid token cases
- cross-tenant / permission-bypass attempts → API E2E (AC-19/AC-20)

### 12.6 AC → Test Coverage Matrix

Close the section with a matrix mapping each AC to the FR(s) it validates, the test layer(s), and the primary test file(s). Include the §13.3 cross-cutting ACs with `API E2E` as their layer, and note that frontend ACs are owned by the frontend/UI suite and out of scope for this backend/API TDD.

Unlike the FRD's "Validated By (Layer)" column (which stays layer + intent), this matrix's **"Primary test file(s)"** column is a reconciliation surface: before implementation it holds the *planned* test intent/path, and real file names are filled in when reconciling against implementation (`spec-sync.instructions.md`).

| AC | FRs validated | Test layer(s) | Primary test file(s) |
| -- | ------------- | ------------- | -------------------- |
| AC-1 | FR-1, FR-2 | Integration (§12.2), UI E2E (§12.4) | list endpoint integration test |
| AC-4 | FR-3, FR-4, FR-6 | Unit (§12.1), Edge (§12.5) | `create-...service.test.ts` |
| AC-19 | FR-1–FR-N | **API E2E (§12.3)** | cross-tenant cases + lifecycle isolation test |

## 13. Rollout, Deployment, and Rollback

### 13.1 Deployment Notes

Include:

- migration sequencing
- env vars/secrets
- Docker/VPS/Nginx implications
- route handling considerations
- config changes

### 13.2 Rollout Strategy

Include:

- feature flag or no flag
- staged rollout if needed
- monitoring plan
- smoke tests

### 13.3 Rollback Strategy

Include:

- safe rollback path
- migration rollback risk
- operational fallback

## 14. Issue Breakdown Guidance

Translate the design into implementation work buckets.

Suggested groups:

- database and migration
- backend services
- endpoints
- integrations
- frontend integration
- QA automation
- DevOps/release
- documentation
- Swagger/OpenAPI
- ADR follow-ups

## 15. ADR Candidates

List decisions that should be captured as ADRs.

For each candidate:

- decision topic
- why it matters
- options considered or likely options

## 16. Open Technical Questions

List unresolved technical decisions.

Each question should be:

- specific
- actionable
- answerable by engineering/product/security/ops

## 17. Appendix

Optional:

- payload sketches
- state transition table
- sequence diagram notes
- sample migration notes
- query examples

---

## Technical design generation process

When using this instruction, follow this sequence:

### Step 1: Read the FRD

Extract:

- business rules
- state transitions
- validations
- data impact hints
- API hints
- acceptance criteria
- NFRs

### Step 2: Identify design-driving decisions

Create a short list of decisions needed before coding, such as:

- new tables vs reuse existing tables
- token strategy
- bulk endpoint strategy
- sync vs async email sending
- soft delete vs hard delete
- idempotency approach

### Step 3: Propose concrete technical solutions

For each major decision:

- recommend an approach
- explain why
- note tradeoffs
- list open questions where not settled

### Step 4: Draft the document

Fill the template with concrete proposals.

### Step 5: Quality check

Before finalizing, verify:

- DB design is concrete enough for migration planning
- API design is concrete enough for issue creation
- security and authorization are not hand-wavy
- tests are listed by level
- rollout and rollback are covered
- open technical questions are explicit

## Quality bar checklist

A Technical Design Document produced with this instruction is acceptable only if:

- backend can identify proposed tables, fields, constraints, and indexes
- API owners can define Swagger/OpenAPI from it later
- GitHub issues can be created directly from its sections
- QA can derive integration and end-to-end scenarios
- DevOps can identify deployment-impacting changes
- ADR-worthy decisions are visible
- unanswered technical questions are clearly listed
- **§12 Testing Strategy mirrors the FRD layer split and links every test entry to its AC(s)/FR(s)**, with a §12.6 AC → Test coverage matrix
- **§12.3 API E2E tests are present (and mandatory for authenticated tenant-scoped endpoints)** — authorization, permissions, and tenant isolation are validated through the live route, not service-level integration tests that bypass the middleware chain

## Recommended style for stack-specific output

When the project stack includes Node.js, Express.js, PostgreSQL, Docker, VPS, and Nginx, prefer the following level of detail:

- Express route/controller/service/repository layering assumptions
- PostgreSQL constraints, indexes, and transaction boundaries
- Docker service/env/config implications
- Nginx routing implications for frontend routes, API routes, and auth callbacks
- background jobs if email or async tasks are involved
- OpenAPI-ready endpoint descriptions
- migration safety and rollback notes

## Formatting for Scanability & Clarity

Technical Design Documents are **implementation-read-heavy** artifacts: engineers will skim them repeatedly during implementation, testing, and operations. Dense prose paragraphs reduce scannability and force context-switching. Use visual structures to make the document reviewer-friendly:

### Use Tables For:

- **Reference data** — e.g., permission model, HTTP status codes, error categories, tech stack versions
- **Comparisons** — e.g., sync vs async tradeoffs, delete strategies, deployment checklist
- **Matrices** — e.g., AC → test coverage, endpoint → middleware chain, field → constraint
- **Transitions** — e.g., state transition rules, what happens in each scenario

Examples:
- Document Control → metadata table (feature name, version, status)
- Permission Model → action × permission × route pattern table
- State Transitions → status × trigger × outcome × validity table
- API Endpoints → method × route × permission × idempotency table

### Use Flow Diagrams For:

- **Sequence flows** — step-by-step request/response + async processing (numbered steps in table format or ASCII art)
- **State machines** — valid/invalid transitions (ASCII state diagram or Mermaid)
- **Architecture** — component interactions (ASCII boxes or architecture diagram)
- **Middleware chains** — how middleware executes in order
- **Scenarios** — happy path, error path, crash recovery

Examples:
- Request lifecycle → middleware chain diagram (`isAuthenticated → hasPermission → authorize`)
- State machine → ASCII state diagram with arrows
- Create + async send → sequence table (step × component × action × state)
- Validation + fallback → scenario flowchart

### Use Lists For:

- **Details that don't fit tables** — e.g., non-standard constraints, caveats, prerequisites
- **Grouped narratives** — e.g., "Why this decision over alternatives"
- **Explanation** — not summary, but reasoning that takes multiple sentences

### Avoid Dense Paragraphs For:

- Technical specifications (use tables instead)
- Comparisons (use comparison matrix instead)
- Step-by-step processes (use sequence table or numbered flow instead)
- Validation rules (use validation table instead)

**Rule of thumb:** If you're about to write a paragraph with more than 2 related facts, ask whether a table would be clearer. Usually it is.

### Real Example

**Instead of:**
> "The create endpoint accepts a batch of emails via POST. Validation happens in stages: first, email format is checked; second, duplicates are detected; third, already-registered status is checked; fourth, requested role validity is verified; finally, self-email conflicts with the requesting admin are caught. All validation categories are collected before returning an error so the client sees all issues at once."

**Write:**
```
#### Create Users Validation Sequence

| Step | Check | Purpose |
|------|-------|---------|
| 1 | Email format | Valid email syntax |
| 2 | Batch duplicates | Case-insensitive |
| 3 | Already-registered | Active users only |
| 4 | Role validity | Requested role must exist |
| 5 | Self-email conflict | Cannot re-invite the requesting admin |

**All failures collected before returning error** — client sees all invalid categories at once.
```

This is more scannable and immediately shows the validation order and purpose.

---

## Best-use prompt

Use this instruction with a prompt like:

> Generate a lightweight technical design document from the attached FRD. Propose the database design, endpoint design, state transitions, validation strategy, authorization model, testing strategy, rollout notes, ADR candidates, and open technical questions. Keep it implementation-oriented and concrete enough for issue breakdown, but do not generate final code or final Swagger docs. Use tables for reference data, comparisons, and matrices; use flow diagrams for sequences and state machines; avoid dense paragraphs in favor of visual structure wherever possible.
