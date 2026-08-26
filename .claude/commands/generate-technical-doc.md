---
description: Generate feature-level technical runtime documentation (docs/technical/*-runtime.md) per technical-doc-guide.
allowed-tools:
  - Read
  - Write
  - Bash
  - Agent
---

# Generate Technical Doc

## Step 1 — Gather inputs

Confirm (ask if missing):

- Target module/feature path (e.g. `apps/backend/src/modules/user-management/F6002-roles`).
- Whether nested route-bearing subfeatures should also be documented (default: yes).

## Step 2 — Required reading

- `apps/backend/docs/instructions/technical-doc-guide.instructions.md`
- The feature's `*.routes.ts`, `*.controller.ts`, `*.service.ts`, `*.policy.ts`, and `swagger-docs/*.swagger.ts`.
- Schema files the feature touches.

## Step 3 — Generate

Delegate to the `backend-doc-writer` agent or follow its rules:

- **Strip commented-out routes** before extracting endpoint paths.
- Use middleware chain order exactly as it appears in the routes file.
- Build a Runtime Errors table from `createError` calls.
- For nested route-bearing subfeatures, produce a runtime doc inside the nested subfeature as well.

## Step 4 — Output location

`apps/backend/src/modules/<module>/.../<feature>/docs/technical/<feature>-runtime.md`

## Step 5 — Report

- New/updated doc files as workspace-relative links.
- Which conditional sections were intentionally omitted, and why.
