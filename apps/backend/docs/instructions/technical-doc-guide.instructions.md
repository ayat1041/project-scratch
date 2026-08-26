---
description: "Feature-level technical documentation standard for backend modules. Auto-injected when editing module docs/technical/*-runtime.md files."
applyTo: "apps/backend/src/modules/**/docs/technical/**"
---

# Technical Documentation Guide

## Overview

This guide defines the standard for writing **feature-level technical documentation** for backend modules.
Technical docs live inside the module they describe and are written for engineers — not end-users.

**Location convention:**

```
src/modules/<domain>/features/<feature>/docs/technical/<doc-name>.md
```

**Naming convention:** Use a descriptive noun phrase for the subject of the doc.

| Subject                       | Filename                      |
| ----------------------------- | ----------------------------- |
| State machine for user roles  | `role-state-machine.md`       |
| Data sync pipeline            | `sync-pipeline.md`            |
| Rate-limit calculation logic  | `rate-limit-calculation.md`   |

---

## Document Structure

Every technical doc must contain the following sections in order:

### Required

| Section                      | Purpose                                                             |
| ---------------------------- | ------------------------------------------------------------------- |
| **Metadata header**          | Version, status, author, date — at the very top                     |
| **Overview / Purpose**       | One paragraph: what this feature does and why it exists             |
| **States / Modes**           | All named states, modes, or phases with exact DB/code values        |
| **State Transition Diagram** | ASCII or Mermaid diagram showing all valid transitions              |
| **Transitions Reference**    | One subsection per transition: trigger, guard, effect, side-effects |
| **DB Schema**                | All relevant columns with type, nullable, and purpose               |
| **Error Catalogue**          | Every thrown error, its trigger, and the HTTP status it maps to     |
| **Related Documents**        | Links to ADRs, swagger docs, or other technical docs                |

### Conditionally Required

| Section                      | Include when                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| **Sub-flows**                | A flow branches based on external state (e.g., user already attached to another org) |
| **Token / Secret Lifecycle** | A JWT, OTP, or signed token is generated and consumed                                |
| **Async Jobs / Queue**       | BullMQ or similar queues emit jobs as part of the flow                               |
| **Bulk Operation Behaviour** | Endpoint accepts multiple IDs with partial-success semantics                         |
| **Design Rationale**         | A non-obvious architectural decision was made (e.g., lazy expiry on GET)             |
| **Changelog**                | Doc is mature enough to have been revised more than once                             |

---

## Metadata Header Template

Place this at the very top of every technical doc, before any heading:

```markdown
> **Status:** Draft | Review | Approved | Deprecated
> **Version:** 1.0.0
> **Author:** <name or team>
> **Last updated:** YYYY-MM-DD
> **Module:** `<path relative to src/>`
```

---

## Section Templates

### States Table

```markdown
## States

| State  | Value    | Description |
| ------ | -------- | ----------- |
| Active | `active` | ...         |
| Paused | `paused` | ...         |

> **Note:** Add any cross-cutting concern that applies to all states (e.g., soft-delete behaviour).
```

### State Transition Diagram

Use ASCII art for portability — no external rendering required.

````markdown
## State Transition Diagram

\```
┌─────────┐
│ state_a │
└────┬────┘
│ trigger_1 (POST /endpoint)
▼
┌─────────┐
│ state_b │
└─────────┘
\```
````

### Single Transition Reference

```markdown
### `from_state` → `to_state`

- **Endpoint:** `VERB /path`
- **Actor:** who triggers this (admin / end user / system / queue worker)
- **Guard:** condition that must be true; what is thrown if it fails
- **Effect:**
  1. Step one
  2. Step two
- **Side-effects:** any writes to other tables, emails queued, etc.
```

### Error Catalogue

```markdown
## Error Catalogue

| Error                | Trigger                                 | HTTP status | Thrown by                       |
| -------------------- | --------------------------------------- | ----------- | ------------------------------- |
| `RESOURCE_NOT_FOUND` | Role ID does not exist                  | `404`       | `resolveResources` middleware   |
| `VALIDATION`         | `delete` action on a system-default role | `422`      | `deleteRoleService`             |
```

### Related Documents

```markdown
## Related Documents

| Document                          | Path                                          |
| --------------------------------- | --------------------------------------------- |
| Swagger doc — assign role         | `swagger-docs/assign-role.swagger.ts`         |
| ADR — batch validation strategy   | `docs/adr/ADR-001-batch-validation.md`        |
```

---

## AI Generation Checklist

When asking an AI tool to generate a technical doc for a feature, provide:

1. All controller files for the feature
2. All service files for the feature
3. The route file (full middleware chain)
4. The DB schema file(s) for all affected tables
5. Relevant constants (status enums, queue names, permission keys)
6. Any validation schema files (Zod)

Then use this instruction:

> Generate a complete technical documentation file for this feature following the conventions in `TECHNICAL_DOC_GUIDE.md`.
>
> **Metadata header must include:**
>
> - Status: Draft
> - Version: 1.0.0
> - Author: (leave a placeholder)
> - Last updated: today's date
> - Module path
>
> **States section must:**
>
> - List every status value from the constants file with exact string values
> - Include a note about soft-delete if `deletedAt` is used
>
> **Transition diagram must:**
>
> - Cover ALL transitions including ones driven by background workers and GET side-effects
> - Use ASCII art (no Mermaid, no external rendering dependency)
>
> **Transitions reference must:**
>
> - Have one subsection per transition
> - State the exact endpoint, actor, guard condition, effect steps, and any side-effects on other tables
> - Call out lazy/side-effect transitions explicitly (e.g., expiry set on GET)
>
> **Error catalogue must:**
>
> - Include EVERY `throw` statement found across all service files
> - Map each to the HTTP status code it produces after error middleware
> - Identify whether it is thrown by middleware or by a service
>
> **Include conditionally:**
>
> - Sub-flows section if any service branches based on the user's state in a _different_ table
> - Token lifecycle section if a JWT or signed token is generated and later consumed
> - Async jobs section if any `queue.add(...)` calls exist in the services
> - Bulk operation behaviour section if any endpoint operates on an array of IDs
> - Design rationale section for any non-obvious architectural decisions found in comments or code structure
>
> **Format rules:**
>
> - Use tables instead of bullet lists when items contain inline code (status values, field names, endpoint paths)
> - ASCII diagrams must be inside fenced code blocks
> - All DB column names must match the actual column names in the schema file (snake_case)
> - All status values must match the exact string values from the constants file

### Common AI mistakes to watch for

| Mistake                    | What to check                                                                 |
| -------------------------- | ----------------------------------------------------------------------------- |
| Missing metadata header    | Is the status/version/author block at the top?                                |
| States mismatch            | Do all values match the constants file exactly?                               |
| Missing GET side-effects   | Does the doc mention lazy expiry or lazy status updates triggered by reads?   |
| Incomplete error catalogue | Count every `throw` in service files and verify each appears in the catalogue |
| Missing sub-flow           | Does any service check a column in a _different_ table to branch logic?       |
| Queue jobs incomplete      | Count every `queue.add(...)` call and verify each appears in the jobs table   |
| Wrong column names         | Are column names taken from the actual Drizzle schema file, not guessed?      |
| No related documents       | Are swagger docs and ADRs for this feature linked?                            |

---

## Quality Bar

Before committing a technical doc, verify:

- [ ] Metadata header is present and filled in
- [ ] Every `status` value in the code appears in the States table
- [ ] Every `throw` in service files appears in the Error Catalogue
- [ ] Every `queue.add()` call appears in the Queue Jobs table
- [ ] Transition diagram matches the Transitions Reference (no undocumented arrows, no missing arrows)
- [ ] All DB column names are in `snake_case` matching the schema file
- [ ] Tables are used instead of bullet lists anywhere inline code appears in list items
- [ ] Related Documents section links to the swagger doc for this feature
