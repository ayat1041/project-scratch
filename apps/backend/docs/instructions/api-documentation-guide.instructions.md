---
description: "Module-local Swagger/OpenAPI authoring guide. Auto-injected when editing files under any swagger-docs/ folder."
applyTo: "apps/backend/src/**/swagger-docs/**"
---

# API Documentation Guide

## Overview

This project uses **Swagger/OpenAPI 3.0** with `swagger-jsdoc` and `swagger-ui-express` to generate interactive API documentation directly from JSDoc comments in your code.

## Accessing the Documentation

Once the server is running, visit:

```
http://localhost:8000/api-docs
```

## How to Document an Endpoint

### Basic Example

Add JSDoc comments to your controller file or create a separate `swagger-docs.ts` file in your module:

```typescript
/**
 * @swagger
 * /api/auth/v1/sign-in:
 *   post:
 *     summary: Brief description of what the endpoint does
 *     description: More detailed explanation
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Success response
 *       400:
 *         description: Bad request
 */
```

## Structure Breakdown

### 1. HTTP Method and Path

```typescript
/api/endpoint-path:
  post:  // or get, put, delete, patch, etc.
```

### 2. Endpoint Metadata

```typescript
summary: "Brief one-line description";
description: "Longer description of functionality";
tags: ["Category"]; // For organizing endpoints
operationId: "uniqueId"; // Optional unique identifier
```

### 3. Request Body Documentation

#### JSON Request

```typescript
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required:
          - fieldName
        properties:
          fieldName:
            type: string
            example: "example value"
            description: "What this field is for"
```

#### Query Parameters

```typescript
parameters:
  - in: query
    name: paramName
    schema:
      type: string
    required: true
    description: "Description of parameter"
```

#### Path Parameters

```typescript
parameters:
  - in: path
    name: id
    schema:
      type: string
    required: true
    description: "User ID"
```

### 4. Response Documentation

```typescript
responses:
  200:
    description: "Success message"
    content:
      application/json:
        schema:
          type: object
          properties:
            success:
              type: boolean
            data:
              type: object
        examples:
          successExample:
            summary: Successful response
            value:
              success: true
              message: "Operation completed"
              data:
                id: "550e8400-e29b-41d4-a716-446655440000"

  400:
    description: "Bad request"
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'
```

### Response Example Standard (Important)

Use this pattern for all JSON responses to keep Postman sync output consistent:

1. Keep `schema` for structure and validation.
2. Always add concrete `content.application/json.examples` (or `example`) for actual payload values.
3. Do not rely only on field-level `schema.properties.*.example` if you expect complete Postman saved response bodies.

Recommended pattern:

```typescript
responses:
  200:
    description: Success response
    content:
      application/json:
        schema:
          type: object
          properties:
            success:
              type: boolean
            message:
              type: string
            data:
              type: object
              properties:
                isUnique:
                  type: boolean
        examples:
          success:
            summary: Successful response
            value:
              success: true
              message: "Email is available"
              data:
                isUnique: true
```

This format is the most reliable for Swagger UI plus automatic Postman collection sync.

### Response-Specific Request Examples (`x-requestExample`)

When syncing to Postman, you can attach a request payload to each response example using a custom extension:

```typescript
responses:
  409:
    description: Conflict
    content:
      application/json:
        examples:
          emailAlreadyExists:
            summary: Email already exists
            x-requestExample:
              name: "John Doe"
              email: "existing.user@example.com"
              password: "P@ssw0rd1234"
              confirmPassword: "P@ssw0rd1234"
              role: "user"
            value:
              success: false
              message: "This email is already in use. Want to log in?"
```

Notes:

1. `x-requestExample` is a custom vendor extension used by this project’s Postman sync endpoint.
2. It does not affect normal OpenAPI validation or Swagger UI behavior.
3. Keep `requestBody.content.application/json.examples` as the default request examples, then override per response with `x-requestExample` when needed.

### 5. Security/Authentication

```typescript
security:
  - cookieAuth: []  # For cookie-based auth
  - bearerAuth: []  # For JWT token

# Or no security (public endpoints):
security: []
```

## Common Data Types

| Type    | Format    | Example                                |
| ------- | --------- | -------------------------------------- |
| string  | -         | "hello"                                |
| string  | email     | "user@example.com"                     |
| string  | uuid      | "550e8400-e29b-41d4-a716-446655440000" |
| string  | date      | "2026-02-18"                           |
| string  | date-time | "2026-02-18T14:30:00Z"                 |
| number  | double    | 3.14                                   |
| integer | int32     | 42                                     |
| integer | int64     | 9223372036854775807                    |
| boolean | -         | true                                   |
| array   | -         | [1, 2, 3]                              |
| object  | -         | { key: "value" }                       |

## Reusable Schemas

Define schemas in `src/config/swagger.ts` and reference them:

```typescript
// In swagger config
schemas: {
  User: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email' },
      name: { type: 'string' }
    }
  }
}

// In your docs, reference it:
schema:
  $ref: '#/components/schemas/User'
```

## Example: Complete Endpoint Documentation

```typescript
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a specific user's profile information
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The user ID
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *
 *   put:
 *     summary: Update user
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: User updated
 *       400:
 *         description: Invalid data
 *       404:
 *         description: User not found
 */
```

## File Organization

### Best Practices

1. **Create per-endpoint files under a `swagger-docs` folder**

   ```
   src/modules/user-management/features/role-management/
    ├── controllers/
    ├── services/
    ├── validations/
    ├── role-management.routes.ts
    └── swagger-docs/
      ├── search-roles.swagger.ts
      ├── create-role.swagger.ts
      └── index.ts
   ```

2. **Export all swagger docs from `swagger-docs/index.ts`**

```typescript
export * from "./search-roles.swagger";
export * from "./create-role.swagger";
```

3. **Use meaningful tags** for organization in UI and Postman folders

```typescript
// Single level folder in Postman
tags:
  - User Management - Role Management

// Nested folders in Postman
tags:
  - User Management - Admin Operations - Permission Management
```

4. **Group related endpoints together when needed**

   ```typescript
   /**
    * @swagger
    * /api/endpoint-1: ...
    * /api/endpoint-2: ...
    * /api/endpoint-3: ...
    */
   ```

## End-to-End Workflow: Generate and Sync to Postman

Use this checklist whenever you add or update Swagger docs.

### 0. Prerequisites

1. Work from backend app root:

```bash
cd /home/softeko-01/softeko/projects/experimental/monorepo/apps/backend
```

2. Ensure backend dependencies are installed (`pnpm install`) and build passes:

```bash
pnpm run build
```

3. Ensure you have Postman credentials:

- `postmanApiKey`
- `postmanCollectionUid`

### 1. Author or Update Swagger Docs

1. Add `@swagger` blocks in module `swagger-docs/*.swagger.ts` files.
2. Keep endpoint path and method exactly aligned with routes.
3. Add concrete `responses.*.content.application/json.examples`.
4. Add `x-requestExample` for response examples where request payload matters for Postman sync behavior.
5. Use a tag format that matches desired Postman folder structure.

### 2. Confirm Module Discovery Pattern

1. Verify the module path is covered by `src/config/swagger.ts` `apis` globs.
2. For user-management features, this pattern should include your files:

```typescript
"./src/modules/user-management/**/swagger-docs/**/*.ts";
```

If your module is outside existing globs, add the required pattern before continuing.

### 3. Restart Backend (Required for Runtime Sync Endpoints)

If you are using runtime sync endpoints (`/api-docs/all-modules/sync*`), restart backend after doc changes.

Why: a stale running process may keep old discovered docs and sync outdated output.

Example approaches:

```bash
# local dev process
pnpm dev

# docker compose flow (if you run backend in containers)
sudo docker compose -f docker-compose.dev.yml -p starter-api-dev up
```

### 4. Generate Combined OpenAPI File

Generate the combined OpenAPI JSON used for sync and auditing:

```bash
pnpm -s tsx scripts/generate-combined-openapi.ts
```

Output file:

- `docs/postman/all-modules.openapi.json`

### 5. Verify New Endpoints Exist in Combined OpenAPI

Use a quick check before syncing to Postman:

```bash
node <<'NODE'
const fs = require('fs');
const s = JSON.parse(fs.readFileSync('docs/postman/all-modules.openapi.json', 'utf8'));
const targets = [
  '/api/user-management/v1/roles',
  '/api/user-management/v1/permissions',
];
for (const t of targets) {
  console.log(t, s.paths?.[t] ? Object.keys(s.paths[t]).join(',') : 'MISSING');
}
NODE
```

Do not sync to Postman until all expected paths are present.

### 6. Run Sync Endpoint

Two useful runtime endpoints:

1. Generate/update combined artifacts:

```bash
curl -sS -X POST "http://localhost:8000/api-docs/all-modules/sync"
```

2. Sync to Postman collection (recommended full step):

```bash
curl -sS -X POST "http://localhost:8000/api-docs/all-modules/sync-postman" \
  -H "Content-Type: application/json" \
  -d '{
    "postmanApiKey": "<POSTMAN_API_KEY>",
    "postmanCollectionUid": "<POSTMAN_COLLECTION_UID>"
  }'
```

Expected success fields include:

- `success: true`
- `pathsCount` (combined OpenAPI path count)
- `collectionUid`

Generated local artifacts after sync:

- `docs/postman/all-modules.openapi.json`
- `docs/postman/all-modules.postman_collection.json`
- `docs/postman/all-modules.existing.postman_collection.json`

### 7. Verify Postman Folder Structure and Requests

After sync, verify collection structure from local generated collection file:

```bash
node <<'NODE'
const fs = require('fs');
const c = JSON.parse(fs.readFileSync('docs/postman/all-modules.postman_collection.json', 'utf8'));
const top = (c.item || []).map(i => i.name);
const userManagement = (c.item || []).find(i => i.name === 'User Management');
const userManagementL1 = (userManagement?.item || []).map(i => i.name);
console.log('TOP', top.join(' | '));
console.log('USER_MANAGEMENT_L1', userManagementL1.join(' | '));
NODE
```

You should see expected module folders (for example `Role Management`) based on your tags.

### 8. Recommended Validation Sequence (Quick Checklist)

1. `pnpm run build`
2. `pnpm -s tsx scripts/generate-combined-openapi.ts`
3. Confirm expected paths exist in `all-modules.openapi.json`
4. Restart backend if runtime process is stale
5. `POST /api-docs/all-modules/sync-postman`
6. Inspect `all-modules.postman_collection.json` for folders, request names, and examples

## AI Generation Checklist (for Copilot / AI tools)

When asking an AI to generate a swagger doc for an endpoint, provide:

1. The controller file (full content)
2. The validation schema file (Zod)
3. The route file showing the full middleware chain
4. Any service files called by the controller
5. Relevant constants (status enums, permission keys)

Then use this instruction:

> Generate a complete OpenAPI 3.0 JSDoc swagger comment block following the conventions in `api-documentation-guide.instructions.md`.
>
> **Description block must include:**
>
> - Plain-English summary of what the endpoint does
> - Full middleware execution order (auth → permission → resource resolver → policy → controller)
> - Step-by-step processing pipeline inside the controller
> - Any all-or-nothing / partial-success behavior with a ⚠️ warning and a concrete example showing that 1 bad item blocks the whole batch
> - Clear distinction between each error status code (especially 400 vs 422 vs 403)
>
> **Request body examples** (`requestBody.content.application/json.examples`):
>
> - Cover every distinct code path: each happy path, each individual failure, combined/mixed failures
> - Use `✅` prefix for success cases, `❌` prefix for failure cases in the summary
> - Named request examples must be referenced by name in the corresponding response examples
> - Do NOT use inline `example:` fields when named examples are present
>
> **Responses — never skip any of the following:**
>
> - `200` — exact response shape with named examples
> - `400` — every distinct response body shape separately if the controller returns different keys for different failures
> - `401` — triggered by `isAuthenticated()` middleware
> - `403` — explain both sub-cases: missing permission (`hasPermission`) AND policy rejection (`authorize`)
> - `404` — **always include when `resolveResource` / `resolveResources` is in the middleware chain** — this is the most commonly missed response
> - `422` — list the specific inputs that trigger it: missing field, empty array, value out of range, wrong type
> - `500` — generic server error
>
> **Project-specific conventions to follow:**
>
> - Use `x-requestExample` on response examples to attach the triggering request payload (used by Postman sync)
> - Tag format must match desired Postman folder structure (e.g. `User Management - Role Management`)
> - Place the file in `swagger-docs/` folder alongside the controller and export from `swagger-docs/index.ts`
> - Reference reusable error shapes with `$ref: '#/components/schemas/Error'`
> - Use `cookieAuth` security scheme for authenticated endpoints

### Common AI mistakes to watch for

| Mistake                          | What to check                                                                                |
| -------------------------------- | -------------------------------------------------------------------------------------------- |
| `404` missing                    | Was `resolveResource` / `resolveResources` in the route?                                     |
| Only one `400` example           | Does the controller have multiple `res.status(400)` branches with different response bodies? |
| `422` is vague                   | Did the AI list the actual Zod triggers (empty array, missing field, etc.)?                  |
| `x-requestExample` missing       | Each response example should have a matching request payload                                 |
| Tag doesn't match Postman folder | Check tag matches the desired nested folder name exactly                                     |
| `403` has only one sub-case      | There are two: `hasPermission` failure and `authorize` policy failure                        |

---

## Tips & Tricks

### Use Tables Instead of Bullet Lists When Items Contain Inline Code

Swagger UI's markdown renderer overflows inline code spans (`` `value` ``) inside bullet list items — they bleed into adjacent lines and become unreadable.

**Avoid this (bullet list with inline code):**

```
- `422` — request body failed schema validation: missing field, empty array, etc.
- `400` — passed schema but failed business logic checks in the controller.
```

**Use this instead (table):**

```
| Code | Triggered by | When |
|------|-------------|------|
| `422` | Zod schema validation | Missing field, empty array, exceeds limit. Rejected before controller. |
| `400` | Controller business logic | Passes schema but fails duplicate, member, or owner checks. |
```

Apply the same pattern to any list where items contain inline code keys, response field names, or enum values.

### Making Fields Required

```typescript
required: -emailField - passwordField;
```

### Array of Objects

```typescript
type: array;
items: type: object;
properties: id: type: string;
name: type: string;
```

### Enum Values

```typescript
type: string
enum:
  - draft
  - published
  - archived
```

### Optional Fields with Default

```typescript
properties:
  status:
    type: string
    default: "active"
```

### Cross-Origin Resource Sharing (CORS)

The API already has CORS enabled for all origins. If you need to restrict it, modify the `serverConfig.cors` in `src/config/server.ts`.

## Testing Endpoints in Swagger UI

1. Open `http://localhost:8000/api-docs`
2. Click on any endpoint to expand it
3. Click "Try it out" button
4. Fill in request parameters/body
5. Click "Execute"
6. View the response below

## Troubleshooting

### Docs not appearing?

- Ensure swagger-docs.ts/comments are formatted correctly
- Check that the file is included in the `apis` array in `src/config/swagger.ts`
- Restart the server
- Clear browser cache
- Ensure you are checking regenerated `docs/postman/all-modules.openapi.json`, not an old file

### Endpoint appears in source docs but not in Postman collection?

- Confirm endpoint exists in `docs/postman/all-modules.openapi.json` first
- If missing there, restart backend and regenerate OpenAPI
- If present in OpenAPI but missing in collection, rerun `/api-docs/all-modules/sync-postman`
- Verify endpoint tag naming matches desired folder grouping format

### Shell command fails with `zsh: event not found`?

- Avoid inline commands containing `!` in double-quoted shell strings
- Prefer heredoc blocks for Node scripts:

```bash
node <<'NODE'
// your script
NODE
```

### Postman security note

- Treat Postman API keys as secrets
- Do not commit keys in scripts or docs
- Rotate keys immediately if exposed in terminal history, logs, or chat

### Parameter not showing?

- Check `required: true` if it's mandatory
- Verify the parameter path/name matches the endpoint path

### Schema reference not working?

- Ensure schema is defined in `components.schemas` in `src/config/swagger.ts`
- Use correct reference format: `$ref: '#/components/schemas/SchemaName'`

## Next Steps

1. Add documentation to all existing endpoints
2. Keep documentation updated when APIs change
3. Use consistent naming and organization
4. Test endpoints in Swagger UI regularly
