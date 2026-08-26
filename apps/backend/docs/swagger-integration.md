# Swagger Integration in VS Code

## Quick Start

### 1. Access Swagger UI

Once your backend server is running, go to:

```
http://localhost:8000/api-docs
```

You should see an interactive API documentation interface.

### 2. Document Your First Endpoint

#### Step 1: Create/Edit swagger-docs.ts in your module

Example path: `src/modules/users/swagger-docs.ts`

```typescript
/**
 * @swagger
 * /api/users/list:
 *   get:
 *     summary: Get list of users
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: List of users
 */
export const usersDocs = {};
```

#### Step 2: Restart server

The Swagger UI will automatically reload and display your new endpoint.

## VS Code Workflow

### Recommended Extensions

1. **REST Client** - Test API endpoints from VS Code
   - Create `.http` or `.rest` files
   - Right-click and "Send Request"

### Example .rest file

```
POST http://localhost:8000/api/auth/v1/sign-in HTTP/1.1
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Without Leaving VS Code

1. **Open the documentation**
   - Use "Open Simple Browser" or preview pane
   - Visit `http://localhost:8000/api-docs`

2. **Test endpoints directly**
   - Click "Try it out" in Swagger UI
   - Fill in request data
   - Click "Execute"
   - View response

3. **Keep docs updated**
   - Edit swagger-docs.ts files
   - Save changes
   - Refresh browser (or auto-reload if enabled)
   - Test in Swagger UI immediately

## File Structure

```
src/modules/
├── auth/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   └── swagger-docs.ts          ← Add docs here
├── users/
│   ├── controllers/
│   ├── routes/
│   └── swagger-docs.ts
└── user-management/
    └── swagger-docs.ts
```

## Common Patterns

### Simple GET Endpoint

```typescript
/**
 * @swagger
 * /api/resource:
 *   get:
 *     summary: Get resources
 *     tags:
 *       - Resources
 *     responses:
 *       200:
 *         description: List of resources
 */
```

### POST with Request Body

```typescript
/**
 * @swagger
 * /api/resource:
 *   post:
 *     summary: Create resource
 *     tags:
 *       - Resources
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Resource created
 */
```

### With Authentication

```typescript
/**
 * @swagger
 * /api/protected:
 *   get:
 *     summary: Protected endpoint
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
```

## Integration Tips

### 1. Keyboard Shortcuts

- Open Terminal: `Ctrl+` ` (backtick)
- Open File: `Ctrl+P`
- Search Files: `Ctrl+Shift+F`

### 2. Split View

```
1. Open swagger-docs.ts in left editor
2. Open browser preview on right side
3. Edit and see changes in real-time
```

### 3. Auto-reload

Use this command in terminal while in VS Code:

```bash
npm run dev
```

This auto-reloads the server on file changes.

### 4. Version Control

Keep swagger-docs.ts files in version control alongside your code.

## Exporting Documentation

### As HTML

1. Use Swagger UI's "Download definition" button
2. Or navigate to `http://localhost:8000/api-docs/?urls.primaryName=swagger.json`

### As OpenAPI JSON

The OpenAPI spec is available at:

```
http://localhost:8000/swagger.json
```

Copy this URL to import into other tools (Postman, Insomnia, etc.)

## Troubleshooting

| Issue                  | Solution                                               |
| ---------------------- | ------------------------------------------------------ |
| Docs don't show        | Check file is in `src/modules/**/swagger-docs.ts` path |
| Changes not reflect    | Restart server with `npm run dev`                      |
| Syntax errors in docs  | Validate JSDoc comment format                          |
| Auth not working in UI | Click "Authorize" button at top of Swagger UI          |

## Next Steps

1. ✅ Start documenting your auth endpoints
2. ✅ Document user/role management endpoints
3. ✅ Add common error responses
4. ✅ Test all endpoints in Swagger UI
5. ✅ Share `/api-docs` link with team

## Resources

- [Swagger/OpenAPI 3.0 Spec](https://swagger.io/specification/)
- [swagger-jsdoc Documentation](https://github.com/Surnet/swagger-jsdoc)
- [Interactive API Documentation Best Practices](https://swagger.io/resources/articles/best-practices-in-api-documentation/)

---

**Happy documenting! 🚀**
