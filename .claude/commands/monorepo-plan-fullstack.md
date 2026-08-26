---
description: Plan a feature that spans backend and one or both client apps — settle the contract first, then emit a per-surface build order with gates between them.
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# Plan Full-Stack Feature

Produces a build plan across surfaces. Creates no files.

Use when a feature needs backend **and** frontend or admin. For a single surface, use `/backend-plan-feature`, `/frontend-plan-feature`, or `/admin-plan-feature` directly.

## Step 1 — Gather inputs

- Feature name and, if one exists, the feature ID
- Which surfaces are in scope: backend, frontend, admin
- The user-facing outcome, in one sentence
- Endpoints needed: method, path, request, response
- New tables or columns?
- New permissions or roles?
- Async work (email, ingestion, sync)?

If an FRD/TDD exists, read it and take the answers from there. If not and there is a Lovable prototype or workflow doc, say so — the spec chain (`/generate-lovable-frd` → `/generate-frd` → `/generate-tdd` → `/generate-issues`) comes first.

## Step 2 — Required reading

- Skill `monorepo-architecture`
- Skill `monorepo-contracts`
- Then each in-scope surface's architecture skill

## Step 3 — Settle the contract first

This is the step that determines whether the rest goes smoothly. Produce a table before any implementation planning:

| Artifact | Name | File in `packages/` | Consumed by |
|---|---|---|---|
| Zod payload schema | `<Domain><Feature>PayloadValidationSchema` | `payload-schemas/<domain>/<feature>/payload.schema.ts` | backend + which clients |
| Inferred request type | `<Domain><Feature>PayloadType` | same file | |
| Response type | `<Domain><Feature>ResponseType` | `response.schema.ts` | |
| Entity type | `App<Entity>` | `tables/` | |
| Status enum / labels | `<FEATURE>_STATUS_LABELS` | `constants/` | |
| Permission | `PERMISSIONS.<DOMAIN>.<NAME>` | `@repo/constants` | |

Rules to apply here, not later:

- Error message copy is authored **once**, in the schema.
- Filter/status display labels are authored once and returned by the backend's list endpoints — no client keeps its own strings.
- Every response uses `{ success, message, data }` so `ApiResponse<T>` narrows on both clients.
- No client re-implements a validation rule the backend enforces.

## Step 4 — Per-surface layer plan

For each in-scope surface, state which layers are needed and which are deliberately skipped:

- **Backend** — route, controller, service, validation, swagger; plus domain queries/commands, policy action, DB change, worker
- **Frontend** — api, service, handler, hook (React Query), component, page
- **Admin** — api, service, handler, Presenter (SSR read — no React Query), table state hook, component, page

Name the Client boundary file for each Next.js app. Mark every list endpoint — those follow `backend-list-endpoints` and drive both clients' table shapes.

## Step 5 — Map the seams

One row per endpoint, across surfaces:

| Endpoint | Backend controller/service | Frontend api→service→handler | Admin api→service→handler |
|---|---|---|---|

This is where a mismatch shows up cheaply — a response shape one client can use and the other cannot.

## Step 6 — Report the build order

```
PHASE 1 — contracts
  /frontend-contract  (or edit packages/ directly)  schemas, response types, entities, constants, permissions
  GATE: pnpm --filter @repo/schemas-types build && pnpm --filter @repo/constants build

PHASE 2 — backend
  /db-change                tables/columns → db:generate → REVIEW SQL → db:migrate
  /backend-query            existence fns, domain queries/commands
  /backend-policy           policy actions + permission wiring
  /create-endpoint          one endpoint at a time
  /backend-worker           if async work is in scope
  /add-swagger-doc
  /generate-tests | /generate-integration-tests
  GATE: pnpm --filter backend build && /backend-verify

PHASE 3 — clients (parallel per app)
  frontend: /frontend-api → /frontend-service → /frontend-handler → /frontend-hook → /frontend-component → /frontend-page
  admin:    /admin-api    → /admin-service    → /admin-handler    → /admin-component → /admin-page
  GATE: /frontend-verify · /admin-verify

PHASE 4 — reconcile
  /monorepo-audit
  /monorepo-verify
  /spec-sync <feature>
```

Backend before clients, always — a client written against an uncommitted shape produces two divergent truths.

## Step 7 — Flag the open questions

List anything that would change the plan and stop for an answer rather than assuming: an unsettled endpoint contract, an unclear permission model, or a proposed schema that would duplicate an existing one.
