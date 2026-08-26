# Final Issue Ticket Document Instruction

Use this instruction whenever you need to generate a single, consolidated execution document from the FRD and Technical Design Document.

## Purpose

Create one final implementation-planning document that combines:

- epic summary
- execution order
- detailed GitHub-ready issue drafts
- dependencies
- blockers
- release-readiness checklist

This document replaces the need for a separate “GitHub Delivery Plan” and “GitHub Issue Drafts” artifact in teams that prefer a single source of execution truth.

The output should be detailed enough for engineering execution, but compact enough that the team does not have to review two overlapping planning documents.

## When to use this

Use this instruction after:

- the FRD is stable
- the Technical Design Document is stable
- open technical questions are resolved or explicitly converted into blocker items
- the team is ready to create issues and begin implementation

Do not use this instruction before the technical design is ready.

## Inputs expected

Gather these if available:

- FRD
- Technical Design Document
- UI/prototype references
- ADRs, if they already exist
- target sprint or milestone
- team ownership information
- repo/module structure
- testing expectations
- rollout constraints

If some inputs are missing, continue with reasonable assumptions and label them clearly.

## Output standard

The output must be written in markdown.

It must be suitable for:

- GitHub epic creation
- child issue creation
- sprint planning
- engineering kickoff
- dependency review
- release planning

This is the final planning artifact before coding.

## Writing principles

- Use the FRD for what must be built.
- Use the Technical Design Document for how it will be built.
- Consolidate planning into one readable document.
- Keep issues scoped, assignable, and testable.
- Put dependencies and execution order in the same artifact as the issue drafts.
- Include enough implementation detail for engineers to act without rereading all source docs.
- Include testing expectations inside each issue.
- Keep blockers visible.
- Separate must-have implementation work from optional follow-up work.

## What this document should cover

This document should include:

- planning context
- recommended execution order
- epic title and description
- epic acceptance criteria
- detailed issue drafts
- dependencies
- blocker/open-question section
- suggested labels/metadata
- suggested PR breakdown
- release-readiness checklist

## What this document should not do

- Do not restate the entire FRD.
- Do not restate the entire Technical Design Document.
- Do not create vague tickets like “implement backend.”
- Do not omit acceptance criteria or testing notes.
- Do not split the artifact into separate “plan” and “issue draft” documents.
- Do not include final estimates unless explicitly requested.

## Required structure

Use the following template.

---

# Final Issue Ticket Document: <Feature Name>

## 1. Planning Context

- **Feature Name:**
- **Related FRD:**
- **Related Technical Design Doc:**
- **Primary Goal:**
- **Target Milestone / Sprint:** if known
- **Assumptions:**
- **Open Dependencies:**

## 2. Recommended Execution Order

List the major phases in the order they should happen.

Example:

1. schema, migration and validation work
2. service/repository layer
3. API layer
4. async jobs/integrations
5. frontend integration
6. QA automation
7. documentation and release readiness

For each phase, explain why it comes in that order.

## 3. Epic Definition

### 3.1 Epic Title

Provide a GitHub-ready epic title.

### 3.2 Epic Description

Write a concise epic description covering:

- business outcome
- scope
- key technical elements
- excluded items
- major risks or dependencies

### 3.3 Epic Acceptance Criteria

Write high-level criteria for when the epic is done.

## 4. Detailed Issue Drafts

Create implementation issues grouped by workstream.

Recommended workstreams:

- blocker / decision issues if still needed
- database and migrations
- backend domain/services
- backend API/controllers
- external integrations / background jobs
- frontend integration
- QA / automation
- DevOps / release
- documentation / API docs
- ADR follow-ups if needed

For each issue use this exact format:

### Issue <N>: <Title>

**Suggested Labels:** <labels>  
**Suggested Owner:** <Backend / Frontend / QA / DevOps / Shared>  
**Epic:** <epic title or epic reference>  
**Priority:** <if known>  
**Dependencies:** <issue numbers/titles or “none”>

#### Summary

Briefly describe what this issue delivers.

#### Purpose

Explain why this issue exists and what part of the feature it unlocks.

#### Scope

List what must be included in this issue.

#### Out of Scope

List what should not be done in this issue.

#### Inputs / References

Reference only the relevant parts of:

- FRD
- Technical Design Document
- ADRs if relevant

#### Implementation Notes

Include practical guidance such as:

- file/module areas likely affected
- endpoint/table names
- migration details
- validation/security expectations
- worker/integration notes
- sequencing constraints

#### Acceptance Criteria

Use a testable checklist:

- [ ] ...
- [ ] ...
- [ ] ...

#### Testing Notes

Include the required test coverage:

- unit tests
- integration tests
- end-to-end tests
- manual verification
- failure-path tests

#### Definition of Done

State what must be true for the issue to be complete.

## 5. Dependency Graph / Ordering Notes

Describe which issues must happen first and which can happen in parallel.

Include examples such as:

- migration before dependent services
- services before controllers
- backend contracts before frontend integration
- worker/integration before full E2E validation
- docs and release tasks before production rollout

## 6. Blockers and Open Decisions

List any unresolved items that still affect execution.

For each item include:

- blocker description
- impacted issues
- owner to resolve
- suggested next action

If there are no blockers, say so clearly.

## 7. Suggested Labels / Metadata

Optionally suggest:

- labels
- milestone
- priority conventions
- epic link behavior
- `ADR-needed` marker where relevant

## 8. Suggested PR Breakdown

Recommend how the work should be split into pull requests.

Examples:

- PR 1: schema + migration + validation
- PR 2: service layer + tests
- PR 3: API/controllers + integration tests
- PR 4: queue/worker + operational notes
- PR 5: frontend integration
- PR 6: Swagger/docs + release cleanup

## 9. Release Readiness Checklist

Include final release tasks such as:

- migrations reviewed
- env vars documented
- worker deployed
- endpoints documented
- tests passing
- smoke tests executed
- monitoring confirmed
- rollback notes reviewed

---

## Final issue document generation process

When using this instruction, follow this sequence:

### Step 1: Read the FRD and Technical Design Document

Extract:

- scope
- business rules
- acceptance criteria
- data model work
- endpoint work
- validation/security work
- async job/integration work
- test requirements
- rollout requirements

### Step 2: Identify workstreams

Group the work into natural execution buckets.

Typical buckets:

- DB
- services
- API
- async jobs
- frontend
- QA
- DevOps
- docs

### Step 3: Decide execution order

Determine:

- what must happen first
- what can be parallelized
- what depends on stable API contracts
- what depends on infra or worker readiness

### Step 4: Write the epic section

Write a concise but actionable epic summary and epic-level acceptance criteria.

### Step 5: Write the issue drafts

Generate a complete set of implementation-ready issue drafts.

Each issue must:

- be understandable on its own
- have clear scope boundaries
- include dependencies
- include acceptance criteria
- include testing notes
- include definition of done

### Step 6: Add planning controls

Add:

- dependency graph notes
- blockers/open decisions
- labels/metadata
- PR breakdown
- release checklist

### Step 7: Quality check

Before finalizing, verify:

- the document can replace both a delivery plan and issue draft set
- every major technical workstream is represented
- every issue has acceptance criteria and testing notes
- dependencies are explicit
- release-critical work is included
- blockers are visible

## Quality bar checklist

A final issue ticket document produced with this instruction is acceptable only if:

- a team lead can create the GitHub epic and child issues directly from it
- engineers can understand each issue without rereading the entire FRD/TDD
- the team does not need a separate delivery-plan artifact
- QA work is included rather than deferred
- docs and release tasks are included
- ordering and dependencies are explicit enough for sprint planning

## Recommended stack-specific guidance

When the stack includes Node.js, Express.js, PostgreSQL, Docker, VPS, and Nginx, ensure the final issue document explicitly accounts for:

- DB migrations and indexes
- repository/service/controller layering
- request validation and service-level validation
- auth and permission middleware
- Swagger/OpenAPI documentation
- BullMQ/Redis workers for async tasks
- Docker/env configuration
- Nginx or frontend-route considerations where relevant
- integration tests, E2E tests, and rollout checks

## Best-use prompt

Use this instruction with a prompt like:

> Generate a single final issue ticket document from the attached FRD and Technical Design Document. Include the epic summary, execution order, detailed GitHub-ready issue drafts, dependencies, blockers, suggested PR breakdown, and release-readiness checklist. Make it detailed enough to replace both a delivery plan and a separate issue-draft document.
