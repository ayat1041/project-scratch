# AGENTS.md (apps/frontend scope)

Instructions in this file apply to `apps/frontend/**`.

## Runtime And Validation Commands

- Start frontend (from `apps/frontend`): `pnpm run dev`
- Lint frontend: `pnpm run lint`
- Type-check frontend: `pnpm run check-types`
- Build frontend: `pnpm run build`
- Run frontend tests: `pnpm run test`

After frontend code changes, run at minimum:

- `pnpm run lint`
- `pnpm run check-types`

## Non-Negotiable Frontend Rules

- Prefer Server Components by default; add `"use client"` only when client-side interactivity is required.
- Keep data fetching in Server Components/route handlers when possible; avoid client-side fetches that can be server-rendered.
- Do not access browser-only APIs (`window`, `document`, `localStorage`) in Server Components.
- Reuse shared contracts from `packages/*` (`@repo/types`, `@repo/validations`, `@repo/constants`) instead of duplicating schemas/types.
- Keep UI logic in feature components; avoid placing business logic in page files when it can be extracted.
- Maintain existing design system patterns and shared UI package usage (`@repo/ui`) where available.

## Frontend Testing Expectations

- Unit/component tests live in `apps/frontend` and run with Jest.
- Cover loading, success, and error states for data-driven components.
- Add regression tests for route-level behavior when changing navigation, auth guards, or data contracts.

## Boundaries

- Do not hardcode API base URLs, secrets, or tokens.
- Do not introduce a new state management library unless explicitly requested.
- Do not change app-wide theming or layout patterns unless the task asks for it.
