---
description: Author or update an OpenAPI/Swagger doc file (swagger-docs/*.swagger.ts) for a backend endpoint. Enforces examples and $ref reuse.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
---

# Add Swagger Doc

## Step 1 — Gather inputs

Confirm (ask if missing):

- Endpoint method + path
- Module/feature path
- Request shape (params, query, body)
- Success response shape (and status code)
- Error responses to document (status code + error type)

## Step 2 — Required reading

- `.github/instructions/api-documentation-guide.instructions.md`
- `apps/backend/docs/swagger-integration.md`
- An existing `swagger-docs/*.swagger.ts` in the same module for style reference.

## Step 3 — Write the swagger file

- File path: `<feature>/swagger-docs/<action>.swagger.ts`.
- Use JSDoc `@openapi` blocks.
- Reuse shared schemas via `$ref` (do not inline shared shapes).
- Include **concrete response examples** under `content.application/json.examples` (or `example`) — not only field-level examples.
- Document **all** error responses listed for the endpoint.

## Step 4 — Verify

- `pnpm run build` must pass.
- If backend is running, visit `http://localhost:8000/api-docs` and confirm:
  - Endpoint appears under the expected tag.
  - Request body / params render.
  - Each example renders and matches the live response shape.

## Step 5 — Report

- File created/updated.
- Build result.
- Visual-check confirmation (or instruction for the user to run it).
