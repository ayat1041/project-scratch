---
description: Plan a frontend feature before any file is created — pick the module pattern, decide which layers are needed, and produce the exact bottom-up build order.
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# Plan Frontend Feature

Produces a build plan. Creates no files. Run this before `/frontend-scaffold-module`.

## Step 1 — Gather inputs

Confirm (ask if missing, do not guess):

- Domain (`user-management` | `auth` | `common`)
- Feature name (kebab-case, e.g. `api-keys`)
- Route(s) the feature is reachable at
- Is there a public visitor view on the same URL?
- Does the backend endpoint set already exist? If yes, list method + path for each.
- Does the UI have: a filtered/paginated table? bulk actions? a create/edit dialog? tabs?

## Step 2 — Required reading

- Skill `frontend-architecture`
- `apps/frontend/instructions/module-architecture-and-layers.instructions.md` §4, §7, §10
- `apps/frontend/instructions/module-directory.instructions.md` — confirm the feature does not already exist

## Step 3 — Pick the pattern

| Answer | Pattern |
|---|---|
| Public visitor view + authenticated owner edit view on one route | **4A Full-Stack Profile** — ref `modules/user-management/profile/` |
| Private page, tabs, filtered/paginated table, bulk actions | **4B Standalone CRUD** — ref `modules/user-management/api-keys/` |
| Private page, searchable table + add/edit dialog | **4C Lightweight List-Page** — ref `modules/user-management/user-preferences/` |

State the pattern and the reference module before continuing.

## Step 4 — Decide the layers

For each, state **needed / not needed** and why:

- `api/` — always
- `services/` — always
- `handlers/` — only if the feature mutates
- `hooks/` — needed for client reads, URL params, or debounced async checks; not needed for a pure SSR read
- `validations/` — **omit entirely** if the backend owns every validation rule (as `api-keys/` does)
- `types/domain.ts` — only for local composite DTOs and hook option/state types
- `constants/`, `utils/helpers.ts` — as needed
- `utils/testids.ts` — always
- Section context — only if sibling components share selection state
- `components/` — list the zone folders and the presenter(s)

## Step 5 — Map endpoints to layers

One table row per backend endpoint:

| Method + path | `api/` fn | service fn | handler fn | called from |
|---|---|---|---|---|

Reads have no handler — they end at a hook or `page.tsx`.

## Step 6 — Identify contract gaps

List every payload schema, response type, and shared constant that must exist in `@repo/schemas-types` / `@repo/constants` and does not yet. Each becomes a `/frontend-contract` invocation.

## Step 7 — Report the build order

Emit the plan in this exact order — it is bottom-up, and the reverse of the UI→API reading order:

```
0. /frontend-contract  <schema/type names>          then build @repo/schemas-types
1. /frontend-scaffold-module <domain> <feature> <pattern>
2. /frontend-api       <endpoint(s)>
3. /frontend-service   <function(s)>
4. /frontend-handler   <mutation(s)>          skip if read-only
5. /frontend-hook      <query | query-params | async>   skip if SSR-only
6. /frontend-component <presenter, zones, dialogs>
7. /frontend-page      <route>
8. /frontend-test      <module>
9. /frontend-verify
```

Flag any open question that would change the plan, and stop for an answer rather than assuming.
