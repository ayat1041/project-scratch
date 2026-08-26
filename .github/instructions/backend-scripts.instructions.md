---
description: "Rules for one-off scripts and tooling under apps/backend/scripts. Auto-injected when editing those files."
applyTo: "apps/backend/scripts/**"
---

# Backend Scripts Instructions

## Scope

Files under `apps/backend/scripts/` are operational tools (OpenAPI bundling, postman audits, migration helpers). They are **not** part of the request lifecycle and must not import request/middleware code.

## Execution Rules

- Scripts must be runnable via an npm script in `apps/backend/package.json` (do not rely on agents remembering raw `tsx` invocations).
- TypeScript scripts run under `tsx`. Do not assume top-level await is available in CommonJS contexts; if needed, wrap in an `async function main()` and call it.
- Always set a non-zero exit code on failure: `process.exitCode = 1` (preferred) or `process.exit(1)` at the very end.
- Never read secrets from anywhere other than `process.env`. Do not hardcode tokens, DB URLs, or API keys.

## Boundaries

- Do not import from `apps/backend/src/app/*` or `apps/backend/src/server.ts` (no booting the HTTP server from a script).
- Database access from scripts is allowed only via the existing `db` helper from `@/db/db`, and must call `closeDbPool()` (or equivalent) before exiting.
- Redis access must close the connection before exit.

## Output

- Use `console.log` for human-readable output and `console.error` for failures.
- Never log secrets, full request bodies, tokens, or PII.

## Examples

- OpenAPI bundling: `scripts/generate-combined-openapi.ts`
- Postman audit: `scripts/postman-duplicate-audit.js`

When adding a new script, mirror the structure and add a corresponding entry to `package.json`'s `scripts` block.
