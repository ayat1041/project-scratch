---
description: "Core operating rules for the frontend app: Next.js component boundaries, shared contracts, and validation commands."
applyTo: "apps/frontend/**"
---

# Frontend Agent Instructions

## Technology Context

- App framework: Next.js 15 + React 19
- Package manager: pnpm
- Shared packages: `@repo/ui`, `@repo/types`, `@repo/validations`, `@repo/constants`

## Runtime And Validation Commands

- From `apps/frontend`: `pnpm run dev`
- From `apps/frontend`: `pnpm run lint`
- From `apps/frontend`: `pnpm run check-types`
- From `apps/frontend`: `pnpm run build`

After frontend changes, run at minimum:

- `pnpm run lint`
- `pnpm run check-types`

## Non-Negotiable Rules

- Use Server Components by default; use Client Components only when needed.
- Keep server-side data fetching server-side when possible.
- Avoid direct use of browser APIs in Server Components.
- Reuse schemas and types from shared packages; do not duplicate contracts.
- Keep changes minimal and aligned with existing app structure.

## Testing Rules

- For `apps/frontend/**/*.test.ts?(x)`, use Jest conventions already used in this app.
- Add tests for loading, error, and successful render paths when changing async data UI.
- Add tests for form validation and submission outcomes when changing forms.
