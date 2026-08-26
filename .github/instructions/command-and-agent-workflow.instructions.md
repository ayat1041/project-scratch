---
description: "Team guide to running commands and agents at the right time in your development workflow"
applyTo: ""
---

# Command and Agent Workflow Guide

This guide explains **when to use each command and agent** throughout the development lifecycle. Think of it as a decision tree for your daily work.

## Quick Reference: Command Purpose Map

| Command | Purpose | When to Use | Prerequisite |
|---------|---------|-----------|--------------|
| `/generate-lovable-frd` | Generate UI-sourced FRD from Lovable routes/components + workflow docs | Kicking off a feature that has a Lovable prototype | Feature ID assigned; Lovable routes and/or workflow docs available |
| `/generate-frd` | Generate the engineering FRD from the lovable FRD | Business rules/scope need formalizing for engineering | Lovable FRD exists (or equivalent source provided) |
| `/generate-tdd` | Generate the Technical Design Document from the FRD | FRD is stable; engineering needs to decide schema/endpoints/flows | Engineering FRD exists |
| `/generate-issues` | Generate the final GitHub-ready issue ticket document from FRD + TDD | FRD and TDD are stable; ready to create issues and start implementation | FRD and TDD both exist |
| `/scaffold-module` | Create folder structure for a new feature | Starting a new feature | Module exists; feature name decided |
| `/create-endpoint` | Build a complete endpoint (routes + controller + service + tests + docs) | Adding an API endpoint | Feature folder scaffolded; endpoint spec finalized |
| `/db-change` | Modify schema and generate migration | Adding/changing database tables | Schema change documented; tables identified |
| `/generate-tests` | TDD-gated service/controller tests | Formal acceptance criteria exist | Issue ticket + TDD doc + target file |
| `/generate-integration-tests` | Lightweight integration tests without TDD | Testing a service quickly | Service file exists; no formal TDD needed |
| `/add-swagger-doc` | Create or update API documentation | After endpoint is implemented | Endpoint code complete; routes finalized |
| `/generate-technical-doc` | Generate feature-level runtime docs | Documenting implementation details | Feature fully implemented |
| `/review-impact` | Analyze impact of backend file changes | Before merging backend code | Files modified in current branch |
| `/review-impact-admin` | Analyze impact of admin file changes | Before merging admin panel code | Files modified in current branch |
| `/review-impact-frontend` | Analyze impact of frontend file changes | Before merging frontend code | Files modified in current branch |
| `/run-tests` | Execute test files locally | Validating test changes | Test file identified |
| `/spec-sync` | Reconcile specs (FRD/TDD) with implementation | After code lands; before merge | Feature implemented; specs accessible |
| `/commit` | Generate conventional commit message | Staging a change for commit | Changes staged in git |

## Workflow Stages

### Stage 0: Spec-Driven Planning (FRD → TDD → Issues)

**Goal:** Turn a Lovable prototype (or a workflow doc) into an approved FRD, a TDD, and GitHub-ready issues — before any folder is scaffolded.

```
Feature ID assigned → Lovable prototype and/or workflow docs exist
    ↓
Use: /generate-lovable-frd <FeatureID>
    ↓
Confirms: feature ID, Lovable routes/components, supporting workflow docs
    ↓
Output: <FeatureID>-FRD(lovable)-<slug>.md — UI-as-built facts, §12 docs↔UI conflicts logged
    ↓
Use: /generate-frd <FeatureID>
    ↓
Reads: the lovable FRD (auto-located); carries forward unresolved SC-*/OQ-* by original ID
    ↓
Output: <FeatureID>-FRD-<slug>.md — business rules, scope, FR/BR/AC split by layer
    ↓
Use: /generate-tdd <FeatureID>
    ↓
Reads: the engineering FRD (auto-located)
    ↓
Output: <FeatureID>-TDD-<slug>.md — DB design, endpoint design, testing strategy, ADR candidates
    ↓
Use: /generate-issues <FeatureID>
    ↓
Reads: FRD + TDD (both auto-located)
    ↓
Output: <FeatureID>-ISSUES-<slug>.md — epic, ordered issue drafts, blockers, PR breakdown
    ↓
Next: Move to Stage 1 (Starting a New Feature) using the generated issues
```

All four commands are written to `<feature-dir>/docs/frds/` and follow the naming convention `<FeatureID>-FRD(lovable)-<slug>.md` / `<FeatureID>-FRD-<slug>.md` / `<FeatureID>-TDD-<slug>.md` / `<FeatureID>-ISSUES-<slug>.md`.

**When to use this stage:**
- A Lovable prototype exists for the feature (`apps/joy-signup-page/src`) and/or there are workflow spreadsheets/PDFs to formalize
- No FRD/TDD/issues exist yet for this feature ID
- You want the FRD → TDD → issues chain to stay traceable (`SC-*`/`OQ-*` IDs carried forward, FR/AC linked by layer) instead of hand-writing specs

**When NOT to use this stage:**
- The feature already has an approved FRD/TDD/issue set — jump straight to Stage 1
- There's no Lovable prototype and no workflow doc — write the FRD manually or start from `/generate-frd` with pasted requirements instead of `/generate-lovable-frd`

**Each command gate-checks its inputs** — if you run one out of order (e.g. `/generate-tdd` before an FRD exists), it stops and tells you which upstream command to run first, rather than guessing.

---

### Stage 1: Starting a New Feature

**Goal:** Set up the folder structure and basic stubs.

```
Issue ticket created → Requirement document written
    ↓
Use: /scaffold-module
    ↓
Confirms: parent module, feature name, actions (CRUD set)
    ↓
Output: folder structure + stub functions + basic types
    ↓
Next: Move to Stage 2
```

**Example:**
```
/scaffold-module

Prompts:
- Parent module: user-management
- Feature name: api-keys
- Initial actions: create, get-single, list, delete
- Purpose: Manage API authentication keys for users

Creates:
- apps/backend/src/modules/user-management/api-keys/
- controllers/, services/, validations/, swagger-docs/, tests/
- Stubs that throw createError.notImplemented()
```

**When NOT to scaffold:**
- Feature already exists in the codebase
- You're adding a single endpoint to an existing feature (jump to `/create-endpoint` instead)

---

### Stage 2: Implementing the Feature

**Goal:** Build endpoints, services, and business logic.

#### Option A: Building a Single Endpoint

```
Endpoint spec finalized (HTTP method, path, permissions, schema)
    ↓
Use: /create-endpoint
    ↓
Confirms: HTTP method, path, target module, permissions, request/response shape
    ↓
Output: routes + controller + service + validations + swagger doc + tests
    ↓
Verify: pnpm run build passes
    ↓
Next: Move to Stage 3 (Spec Sync)
```

**When to use `/create-endpoint`:**
- You have a specific endpoint to build
- You know the HTTP method, path, and response contract
- You have permission/resource requirements clear
- Swagger doc should be auto-generated
- Tests should be auto-generated

**Example:**
```
/create-endpoint

Method: POST
Path: /api/v1/user/{userId}/api-keys
Module: user-management/api-keys
Permissions: createApiKey (new permission)
Resource to resolve: user by userId
Request shape: { name: string, expiresIn?: number }
Response shape: { id, name, token, createdAt, expiresIn }
```

#### Option B: Modifying Database Schema

```
Schema change requirement identified
    ↓
Use: /db-change
    ↓
Confirms: tables affected, nature (add column, add table, etc.), invariants
    ↓
Output: schema files + generated migration SQL
    ↓
Review: SQL for unintended drops/data loss
    ↓
Verify: pnpm run build passes
    ↓
Next: Update endpoints that touch the changed tables
```

**When to use `/db-change`:**
- Adding a new table or column
- Modifying table constraints or indexes
- Renaming or restructuring schema
- The change requires a database migration

**Important:** Schema changes often require endpoint updates. After `/db-change`, re-run `/create-endpoint` or `/add-swagger-doc` for affected endpoints.

---

### Stage 3: Testing

**Goal:** Ensure the feature works correctly.

#### Option A: TDD-Gated Testing (Formal Path)

```
Issue ticket with acceptance criteria → TDD document written
    ↓
Code implemented (service/controller)
    ↓
Use: /generate-tests (gated by issue + TDD)
    ↓
Requires in context:
  - Issue ticket (with AC and linked TDD)
  - TDD sections (domain model, state design, validation, testing strategy)
  - Target file (service or controller to test)
    ↓
Output: integration tests covering all ACs + error paths
    ↓
Verify: pnpm run build passes; tests run via tsx --test
    ↓
Next: Code review → Stage 4 (Spec Sync)
```

**When to use `/generate-tests`:**
- Issue ticket exists with formal acceptance criteria
- TDD document exists and is linked
- You want tests to be grounded in requirements
- The feature is complex or critical
- You need 100% confidence in the AC coverage

**Example:**
```
/generate-tests

Provide:
1. Issue ticket: #42 - "Implement bulk invite expiration"
2. TDD sections: Domain model (invitation states), validation rules
3. Target file: invitation.service.ts

Output:
- Tests for each AC
- Tests for each invalid state transition
- Tests for each error type
- DB state assertions
```

#### Option B: Quick Integration Testing (Lightweight Path)

```
Service implemented but no formal TDD
    ↓
Use: /generate-integration-tests
    ↓
Confirms: service file(s), actions to cover
    ↓
Output: node:test integration tests with real DB
    ↓
Verify: pnpm run build passes; tests run locally
    ↓
Next: Code review → Stage 4 (Spec Sync)
```

**When to use `/generate-integration-tests`:**
- Service exists; code is ready to test
- No formal TDD or issue ticket required
- You want quick, practical test coverage
- Tests will use real DB (not mocks)
- Lighter weight than `/generate-tests`

**When NOT to use:**
- You have a formal issue + TDD (use `/generate-tests` instead)
- Your feature is safety-critical or complex

---

### Stage 4: Documentation

**Goal:** Make the feature discoverable and maintainable.

```
Feature implemented and tested
    ↓
Use: /add-swagger-doc (if /create-endpoint didn't auto-generate)
    ↓
Updates: OpenAPI JSDoc with request/response schemas and examples
    ↓
Verify: http://localhost:8000/api-docs shows the endpoint correctly
    ↓
Later, if needed:
    ↓
Use: /generate-technical-doc
    ↓
Output: runtime docs explaining implementation details, caveats, performance notes
```

**When to use `/add-swagger-doc`:**
- Endpoint exists but swagger docs are missing or outdated
- `/create-endpoint` already generated them (skip unless updating)
- You need to add concrete examples or fix schema definitions

**When to use `/generate-technical-doc`:**
- Feature is fully implemented and in production
- You want to document how it works internally (for future maintainers)
- You want to explain caveats, performance characteristics, or design decisions

---

### Stage 5: Spec Reconciliation (Before Merge)

**Goal:** Ensure specs (FRD, TDD, issue) stay aligned with implementation.

```
Code merged to feature branch
    ↓
All downstream artifacts generated (tests, docs, swagger)
    ↓
Use: /spec-sync <feature-name>
    ↓
Reads: current implementation (schema, validations, routes, services)
    ↓
Diffs against: FRD, TDD, issue ticket
    ↓
Checks: status enums, transitions, validation limits, error codes, endpoints, permissions
    ↓
Output: DRIFT/GAP/STALE-REF items + required spec updates
    ↓
Update specs → Code review → Ready to merge
```

**When to use `/spec-sync`:**
- Feature is implemented and code-reviewed
- All tests are passing
- All swagger docs are generated
- Before creating a PR or merging to main
- After any downstream artifact (runtime docs, tests, swagger) is produced

**What it catches:**
- Enum values in code that don't match spec
- Validation limits that have drifted
- Error codes missing from TDD
- New endpoints not in FRD
- Permission scopes that changed
- Async/queue behavior differences

**Example:**
```
/spec-sync api-keys

Reads:
- apps/backend/src/modules/user-management/api-keys/ (all files)
- docs/features/api-keys.frd.md
- docs/features/api-keys.tdd.md
- GitHub issue #23

Diffs:
✓ All status enums match FRD
✗ Validation: maxActiveKeys is 20 in code but spec says 10
✗ Error code API_KEY_EXPIRED missing from TDD error table
✓ All endpoints in FRD
✓ Permissions match policy.ts

Output:
- Update FRD to maxActiveKeys: 20
- Add API_KEY_EXPIRED to TDD error table
- No code changes needed
```

---

### Stage 6: Quality Checks (Before Merge)

**Goal:** Assess the blast radius of changes and catch issues.

```
Feature branch ready for merge
    ↓
Use: /review-impact (for backend changes)
    Use: /review-impact-admin (for admin changes)
    Use: /review-impact-frontend (for frontend changes)
    ↓
Output: impact assessment across dependent files, configs, and flows
    ↓
Address any concerns → Request code review
```

**When to use `/review-impact*` commands:**
- Before requesting a code review
- After significant backend/admin/frontend file changes
- To understand what else might break
- To identify missing wiring or config updates
- To catch cross-module dependencies you might have missed

**What they assess:**
- Files that import from your changed files
- Configuration that references your changed types
- Integration points with other modules
- API contract changes and downstream impacts
- Permission/auth changes

---

### Stage 7: Final Commit

**Goal:** Create a well-formatted commit with proper messaging.

```
All changes staged in git
    ↓
Use: /commit
    ↓
Analyzes: staged changes
    ↓
Generates: conventional commit message
    ↓
Optional: link to GitHub issue
    ↓
Output: formatted message for review
    ↓
User confirms → Commit created
    ↓
Done!
```

**When to use `/commit`:**
- All changes are staged (`git add ...`)
- You're ready to commit to your feature branch
- You want a well-formatted, conventional commit message
- Preferably before merging to main or creating a PR

**Example:**
```
/commit

Staged files:
- apps/backend/src/modules/user-management/api-keys/controllers/...
- apps/backend/src/modules/user-management/api-keys/services/...
- apps/backend/src/modules/user-management/api-keys/tests/...
- apps/backend/src/modules/user-management/api-keys/swagger-docs/...

Generated message:
feat(backend): #18 implement API key management for user accounts

Added create, list, get, and delete endpoints for API keys.
Includes TDD-driven integration tests and Swagger documentation.

Link to issue? (y/n): y
Issue number: 18

✓ Final message:
feat(backend): #18 implement API key management for user accounts

Added create, list, get, and delete endpoints for API keys.
Includes TDD-driven integration tests and Swagger documentation.
```

---

## Using Agents

Commands invoke agents automatically. You can also call agents directly when you need deeper expertise:

| Agent | Best Used For | When to Invoke |
|-------|---------------|----------------|
| `backend-implementer` | Implementing complex endpoints | Command suggests it; or when you want specialist review during implementation |
| `backend-test-author` | Writing comprehensive integration tests | `/generate-tests` or `/generate-integration-tests` uses it; or standalone for complex test suites |
| `backend-doc-writer` | Generating feature-level runtime documentation | `/generate-technical-doc` uses it; or directly for detailed implementation guides |
| `backend-migration-author` | Authoring schema changes and migrations | `/db-change` uses it; or directly for complex multi-table refactors |
| `backend-reviewer` | Code review and standards checking | After you've implemented, before merge; for architectural review |
| `admin-reviewer` | Admin panel code review | Before merging admin changes; for accessibility and UX concerns |
| `frontend-reviewer` | Frontend code review | Before merging frontend changes; for React/Next.js standards |

**How to invoke an agent directly:**

Use the Agent tool in Claude Code:
```
Agent(description: "Review this backend change for middleware order violations", subagent_type: "backend-reviewer")
```

Or mention in conversation:
> "Can a backend-reviewer take a look at my new endpoint for middleware chain order?"

---

## Common Workflows: Decision Trees

### "I'm starting a brand new feature"

```
Do you have an approved FRD/TDD/issues for this feature ID?
├─ No → Do you have a Lovable prototype or workflow docs?
│        ├─ Yes → /generate-lovable-frd → /generate-frd → /generate-tdd → /generate-issues
│        │        (Stage 0 — see above)
│        └─ No → Write the FRD manually, or start from /generate-frd with pasted requirements
│
└─ Yes → continue below

Do you have a feature folder already?
├─ No → /scaffold-module
│       ↓
│      Feature folder created with stubs
│       ↓
│      Do you want to implement endpoints now?
│      ├─ Yes → /create-endpoint (one endpoint at a time)
│      └─ No → Done for now; implement manually later
│
└─ Yes → Do you need a new endpoint in that folder?
         ├─ Yes → /create-endpoint
         └─ No → Done; implement manually or use other commands
```

### "I've implemented a feature and want to test it"

```
Do you have a formal issue + TDD document?
├─ Yes → /generate-tests (TDD-gated, high confidence)
│
└─ No → /generate-integration-tests (lightweight, quick)
         ↓
        Tests generated with real DB
         ↓
        Run locally: tsx --test <path>
         ↓
        All passing?
        ├─ Yes → Proceed to Spec Sync
        └─ No → Fix code or test issues
```

### "I'm about to merge my feature branch"

```
Have you:
1. ✓ Implemented all endpoints?
2. ✓ Written all tests?
3. ✓ Generated swagger docs?
4. ✓ Generated runtime docs (if needed)?

If all yes:
    ↓
Use: /spec-sync <feature-name>
    ↓
All DRIFT/GAP items resolved?
├─ Yes → Use: /review-impact (backend)
│         All concerns addressed?
│         ├─ Yes → Use: /commit (after code review)
│         └─ No → Fix issues and re-run /review-impact
│
└─ No → Update specs and rerun /spec-sync
```

### "I've modified a critical backend file"

```
Is it a schema/migration change?
├─ Yes → /db-change
│
└─ No → Did you change an existing endpoint?
         ├─ Yes → /create-endpoint (replace old implementation)
         │
         └─ No → Did you change service/controller files?
                  ├─ Yes → /generate-integration-tests or /generate-tests
                  │
                  └─ No → Ready for code review
                           ↓
                          Use: /review-impact
                           ↓
                          Address concerns
                           ↓
                          Use: /commit
```

---

## What Runs Automatically vs. What You Trigger

The harness contains both **automatic guardrails** (that run without you doing anything) and **manual commands** (that you invoke when needed). Understanding this distinction helps you know what's happening behind the scenes.

### ✅ Automatic: Things the Harness Does For You

These run without any action from you — they're safety nets that catch issues early.

#### **SessionStart Hook (when you start Claude Code)**
- **Checks:** graphify freshness — warns if the knowledge graph is stale relative to code changes
- **Action:** Non-blocking warning; tells you to run `graphify update .` if the graph is behind
- **When:** Every time you invoke Claude Code in this repo

#### **Pre-Commit Hook (when you run `git commit`)**
Runs automatically on every commit. Never blocks the commit; only warns.

| Check | What it does | Output |
|-------|-------------|--------|
| **Type checking** | `pnpm run build` on staged files | Blocks if TypeScript errors found |
| **Spec drift** | Detects endpoint↔swagger and enum↔doc mismatches | Warns if drift found; doesn't block |
| **AC traceability** | Confirms every acceptance criterion in FRD has a test | Warns if AC missing a test; doesn't block |
| **Spec staleness** | Checks if FRD is >5 commits behind its source code | Warns if stale; doesn't block |
| **Stale artifacts** | Checks if test/swagger files changed but source didn't | Reminds you to verify |

**Example pre-commit output:**
```
✓ Type checking passed
⚠ Spec drift: 1 endpoint missing swagger docs
⚠ AC-5 in FRD but no test references it
ℹ Reminder: you changed tests but not the source file
```

#### **Post-Commit Hook (after you commit)**
Runs in the background after every commit.

| Task | What it does |
|------|-------------|
| **graphify update** | Automatically refreshes the knowledge graph to stay in sync with code |
| **Stale artifact reminder** | Reminds you if you updated test/swagger files without updating source |

#### **CI Jobs (on every PR / before merge)**
Runs in GitHub Actions when you push or create a PR. These are the hard gates — they can block merges.

| Job | What it does | Blocks? |
|-----|-------------|---------|
| **lint-and-build** | TypeScript check + linting + build | ✅ YES — blocks if failed |
| **service-tests** | Runs integration tests with real DB/Redis | 🟡 No (pending first green run) |
| **graph-freshness** | Warns if code changed since graph was built | ⚠️ No — annotation only |

---

### 🎯 Manual: Commands You Invoke When Needed

These are the 17 commands you run to build features. Each one is opt-in — you choose when to use it.

#### **You Always Do These (when starting from a prototype/workflow doc, no FRD/TDD/issues yet)**
- `/generate-lovable-frd` — UI-sourced FRD from Lovable routes + workflow docs
- `/generate-frd` — engineering FRD from the lovable FRD
- `/generate-tdd` — Technical Design Doc from the FRD
- `/generate-issues` — GitHub-ready issue doc from FRD + TDD

#### **You Always Do These**
- `/scaffold-module` — start a new feature folder
- `/create-endpoint` — build an endpoint end-to-end
- `/generate-tests` or `/generate-integration-tests` — write tests
- `/db-change` — modify schema and migrations
- `/spec-sync <feature-name>` — reconcile specs before merge
- `/commit` — create a standardized commit message

#### **You Sometimes Do These**
- `/add-swagger-doc` — if endpoints don't auto-generate docs
- `/generate-technical-doc` — if you want runtime documentation
- `/review-impact` — assess blast radius before merge
- `/run-tests` — run a test file locally to debug

---

### 📊 Timeline: What Happens When

This shows the full lifecycle and when automatic vs. manual actions trigger:

```
YOU START WORK
    ↓
You run: /scaffold-module
    ↓
You run: /create-endpoint (1+ times)
    ↓
You run: /generate-tests
    ↓
You run: git add <files>
    ↓
You run: git commit
    ↓
HARNESS RUNS AUTOMATICALLY:
├─ Pre-commit: type-check, spec-drift, AC-trace, spec-stale (all warn-only)
├─ Post-commit: graphify update, stale-artifact reminder
    ↓
You run: /spec-sync <feature-name>
    ↓
You run: /review-impact
    ↓
You run: /commit (again, if changes from spec-sync)
    ↓
You push: git push origin <branch>
    ↓
HARNESS RUNS AUTOMATICALLY IN CI:
├─ lint-and-build (blocks if failed)
├─ service-tests (pending gate)
├─ graph-freshness (annotation only)
    ↓
All green → code review → merge → done!
```

---

### 📋 Decision: When to Check Pre-Commit Warnings

The pre-commit hook **warns** but never **blocks**. You decide what to do:

| Warning | Meaning | Your action |
|---------|---------|------------|
| "Spec drift: endpoint missing swagger" | A route exists but no swagger docs | Run `/add-swagger-doc` before merging |
| "AC-5 in FRD but no test references it" | Acceptance criterion not tested | Run `/generate-tests` or add test reference |
| "FRD is 7 commits behind source" | Spec is stale relative to code | Run `/spec-sync` to update FRD |
| "Tests changed but source file didn't" | Test file updated without code changes | Verify the test is correct and intentional |

**Rule:** If pre-commit warns, fix it before pushing. Don't ignore the warnings — they're there to catch drift early.

---

### 🚨 CI Gates: What Actually Blocks Merges

Only these things block a merge:

1. **`lint-and-build` fails** — TypeScript errors, linting failures, or build errors → **FIX THE CODE**
2. **`service-tests` fails** (once enabled) — Integration tests fail → **FIX THE CODE OR TESTS**

Everything else in CI is annotation-only (helpful but non-blocking).

---

### 💡 Key Insight: Layered Enforcement

The harness uses **four altitudes** of enforcement:

| Altitude | Examples | Blocks you? |
|----------|----------|-----------|
| **Context** | instruction files, `.claude.md`, graphify | No — guidance only |
| **Warn** | pre-commit warnings, SessionStart hooks | No — you see them, you decide |
| **Block (local)** | pre-commit type-check, lint-staged | Yes — but you're at your machine; easy to fix |
| **Block (CI)** | lint-and-build in GitHub Actions | Yes — blocks the merge; everyone sees it |

This layering gives you fast feedback locally (you catch issues before pushing) and a final gate in CI (bad code can't ship).

---

### Before Running Any Command

1. **Read the prerequisites** — each command lists what you need to provide
2. **Stage changes** — only `/commit` requires staged changes; others require context (files, issue tickets, etc.)
3. **Ensure `pnpm run build` passes** — after any command that modifies code
4. **Update schema exports** — after `/db-change`, update `apps/backend/src/db/schema/index.ts`

### During Command Execution

1. **Be specific with inputs** — "user-management/api-keys" is clearer than "api-keys"
2. **Provide full context** — `/generate-tests` needs the exact issue and TDD doc
3. **Review generated code** — commands are assistants, not oracles; verify the output makes sense

### After Command Completion

1. **Run `pnpm run build`** — non-negotiable; it catches type errors
2. **Test locally** — if the docker stack is up, verify the feature works
3. **Review generated files** — ensure naming, structure, and style match the codebase
4. **Commit with `/commit`** — use the standardized commit flow

---

## Checklist: Ready to Merge?

Before requesting a code review:

- [ ] All endpoints implemented (`/create-endpoint` for each)
- [ ] All tests passing (via `/generate-tests` or `/generate-integration-tests`)
- [ ] Swagger docs auto-generated (via `/create-endpoint` or `/add-swagger-doc`)
- [ ] `pnpm run build` passes
- [ ] Feature-level runtime docs added (if complex, via `/generate-technical-doc`)
- [ ] `/spec-sync` run; no DRIFT/GAP items remain
- [ ] `/review-impact` run; all concerns addressed
- [ ] Staged changes reviewed; ready for `/commit`
- [ ] Conventional commit message generated and confirmed

Once these are done, you're ready for code review and merge.

---

## Questions?

If you're unsure which command to use:

1. **Identify the stage** — are you starting, implementing, testing, documenting, or merging?
2. **Find the stage above** — read the decision tree for that stage
3. **Follow the prerequisites** — ensure you have what the command needs
4. **Run the command** — provide clear inputs
5. **Verify the output** — build passes, changes look right

If a command tells you it needs something you don't have (e.g., `/generate-tests` needs an issue), stop and provide it. Don't skip the gates — they exist to keep the feature grounded in requirements.
