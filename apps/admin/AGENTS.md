# AGENTS.md (apps/admin scope)

Instructions in this file apply to `apps/admin/**`.

## Runtime And Validation Commands

- Start admin app (from `apps/admin`): `pnpm run dev`
- Lint admin app: `pnpm run lint`
- Type-check admin app: `pnpm run check-types`
- Build admin app: `pnpm run build`
- Run admin tests: `pnpm run test`

After admin code changes, run at minimum:

- `pnpm run lint`
- `pnpm run check-types`

## Non-Negotiable Admin Rules

- Prefer Server Components by default; add `"use client"` only for interactive UI concerns.
- Keep admin authorization and role checks consistent with existing middleware and route patterns.
- Reuse shared contracts from `packages/*` (`@repo/types`, `@repo/validations`, `@repo/constants`) for API payloads and validation.
- Keep table/list management, filters, and mutation flows consistent with existing admin UX patterns.
- Avoid duplicating logic that already exists in shared utilities or feature modules.

## Admin Testing Expectations

- Unit/component tests live in `apps/admin` and run with Jest.
- For any mutation flow, test success, validation failure, and permission failure states.
- For list/filter pages, test query-state handling (empty/loading/error/populated views).

## Boundaries

- Do not hardcode credentials, role IDs, or environment-specific URLs.
- Do not bypass existing auth/permission abstractions.
- Do not introduce broad dashboard-wide redesigns unless explicitly requested.
