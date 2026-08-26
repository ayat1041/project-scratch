---
description: Build a complete frontend vertical slice end to end — contract, api, service, handler, hook, component, route — in the correct bottom-up order with a gate after each layer.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Frontend Feature (full vertical slice)

Runs L0 → L1 in build order. Each layer is gated: a failing gate stops the run, it does not get worked around downstream.

Use this for one coherent slice (one screen, or one endpoint set). For a whole new module, run `/frontend-plan-feature` and `/frontend-scaffold-module` first.

## Step 1 — Gather inputs

- Domain, feature, module pattern (4A / 4B / 4C)
- Every backend endpoint in scope: method, path, request shape, response shape
- The UI surface: route, sections, dialogs, table/filters, bulk actions
- Read or mutate or both

Ask for anything missing. Do not infer an endpoint contract.

## Step 2 — Required reading

Skill `frontend-architecture` first, then each layer's skill as you reach it.

## Step 3 — Build order (do not reorder)

### L0 — Contracts
`/frontend-contract` for every missing schema, response type, and shared constant.
**Gate:** `pnpm --filter @repo/schemas-types build`

### L7 — API transport
`api/api-constants.ts` builders (path-only) + one function per endpoint in `api/<feature>-api.ts`, returning `ApiResponse<T>`, throwing `createApiError`, checking `!response.ok || !result.success`.
**Gate:** `pnpm --filter frontend check-types`

### L6 — Services
One function per operation. Zod `.parse()` where the frontend validates; `wrapZodError` re-throwing non-Zod errors unchanged. Wire→domain mapping. `fetchWithCookiesServer` for SSR reads.
**Gate:** `pnpm --filter frontend check-types`

### L5 — Handlers (mutations only)
`handle<Action><Entity>` in `<area>.handlers.ts`. `toast.success(result.message || fallback)`; catch does `handleErrorToast` **and** `throw error`. Skip entirely for a read-only slice.
**Gate:** `sonner` appears only under `handlers/`

### L4 — Hooks (client reads, URL params, async checks)
`use<Feature>Query` with an exported query key containing every result-affecting param; `use<Feature>QueryParams` reading the URL; race-guarded async hooks.
**Gate:** `pnpm --filter frontend check-types`

### L3 — Section context (only if siblings share selection)
Co-located with its section. Owns selection, never filters or pagination. Consumer hook throws outside the provider.

### L2 — Components
Presenter (layout only) → zone sections → rows → actions → dialogs (`next/dynamic`). One component per file. Test IDs added to `utils/testids.ts` first.
**Gate:** `pnpm --filter frontend lint`

### L1 — Route entry
`page.tsx` as a Server Component with `metadata`; `layout.tsx` for providers; `<Suspense>` around every `useSearchParams` consumer.
**Gate:** `pnpm --filter frontend build`

## Step 4 — Register

Add the module/route to `apps/frontend/instructions/module-directory.instructions.md`.

## Step 5 — Audit and verify

```
/frontend-audit <domain>/<feature>
/frontend-test  <domain>/<feature>
/frontend-verify
```

## Step 6 — Report

Per layer: files created, functions added, gate result. Then:

- Layers deliberately omitted and why
- Contracts added to `packages/` and any sibling app (`backend`, `admin`) they affect
- Anything left incomplete, named explicitly — never reported as done

Stop and ask rather than guessing at: an unknown endpoint contract, an ambiguous ownership/access model, or a schema that would duplicate an existing one.
