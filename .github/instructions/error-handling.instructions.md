---
description: "Error handling patterns for the backend: asyncHandler, createError helpers, global error middleware, and typed errors."
applyTo: "apps/backend/src/**"
---

# Error Handling Architecture

## Overview

This document explains the comprehensive error handling system implemented in the application, using Express.js best practices with global error middleware and async error handling.

## 🔄 Complete End-to-End Error Handling Flow

### 1. Request Arrives at Express App

```
POST /api/auth/v1/sign-up
Body: { name: "Jane Doe", email: "test@test.com", password: "123", role: "user" }
```

### 2. Express Middleware Chain Execution

```typescript
// In app.ts - middleware stack executes in order:
app.use(cors(serverConfig.cors));
app.use(helmet({...}));
app.use(bodyParser.json());
// ... other middleware
registerRoutes(app); // ← Your routes are registered here
app.use(notFoundHandler); // ← 404 handler
app.use(errorHandler);   // ← Global error middleware (MUST BE LAST!)
```

### 3. Route Handler Execution

```typescript
// Example: signup controller wrapped in asyncHandler
export const signupController = asyncHandler(
  async (req: Request, res: Response) => {
    // ↓ VALIDATION LAYER
    const { name, email, password, role } = validateZodSchema(
      signupSchema,
    )(req.body);

    // ↓ BUSINESS LOGIC LAYER
    const roleId = await getRoleByTitle(role);
    const userId = await getOrCreateUserOnSignUp(email, password, name, roleId);

    // ↓ ERROR SCENARIOS CAN HAPPEN HERE
    if (role !== ROLES.USER) {
      // This throws an error!
      throw {
        type: ERROR_TYPES.VALIDATION,
        message: "Not implemented yet",
        details: { error: "Currently, only self-service sign up is supported" },
      };
    }

    // ... rest of the logic
    res.status(200).json(response);
  },
);
```

## 🎯 Error Scenarios & How They're Handled

### Scenario A: Validation Error

```typescript
// If validateZodSchema fails:
const { name, email } = validateZodSchema(signupSchema)({
  email: "invalid-email", // ← Invalid email format
  role: "unknown-role", // ← Invalid role
});
```

**What Happens:**

1. `validateZodSchema` throws a validation error
2. `asyncHandler` catches it: `Promise.resolve(fn(req, res, next)).catch(next)`
3. Error gets passed to `next(error)`
4. Express routes it to global error middleware

### Scenario B: Database Error

```typescript
// If database operation fails:
const userId = await getOrCreateUserOnSignUp(email, password, name, roleId);
// ↑ Database connection lost, constraint violation, etc.
```

**What Happens:**

1. Database throws an error (e.g., connection timeout)
2. `asyncHandler` catches it automatically
3. Passes to `next(error)`
4. Global error middleware handles it

### Scenario C: Business Logic Error

```typescript
// Deliberately thrown business logic error:
if (role !== ROLES.USER) {
  throw {
    type: ERROR_TYPES.VALIDATION,
    message: "Not implemented yet",
    details: { error: "Currently, only self-service sign up is supported" },
  };
}
```

**What Happens:**

1. Error is thrown deliberately
2. `asyncHandler` catches it
3. Passes to `next(error)`
4. Global error middleware processes it

## 🔧 Global Error Middleware Processing

```typescript
// In error.middleware.ts
export function errorHandler(
  error: ApiError | CustomError | Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  let statusCode = 500;
  let message = "Internal server error";
  let errorType = ERROR_TYPES.INTERNAL_SERVER_ERROR;

  // ↓ ERROR TYPE DETECTION
  if (error.type === ERROR_TYPES.VALIDATION) {
    statusCode = 422;
    message = error.message || "Validation error";
  } else if (error.type === ERROR_TYPES.DATABASE) {
    statusCode = 503;
    message = error.message || "Database service unavailable";
  } else if (error.type === ERROR_TYPES.UNAUTHORIZED) {
    statusCode = 401;
    message = error.message || "Unauthorized";
  }
  // ... other error types

  // ↓ LOGGING
  logger.error("Error occurred:", {
    statusCode,
    message,
    type: errorType,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // ↓ RESPONSE FORMATTING
  const errorResponse = {
    success: false,
    message,
    ...(Object.keys(details).length > 0 && { details }),
    ...(isDevelopment && { type: errorType }),
  };

  res.status(statusCode).json(errorResponse);
}
```

## 📤 Response Examples

### Success Response

```json
{
  "success": true,
  "message": "Verification link sent to your email. Please check your inbox.",
  "verificationLink": "http://frontend.com/verify...",
  "_links": {
    "redirectUrl": "http://frontend.com/please-verify"
  }
}
```

### Error Response (Validation Error)

```json
{
  "success": false,
  "message": "Not implemented yet",
  "details": {
    "error": "Currently, only self-service sign up is supported"
  },
  "type": "validation"
}
```

### Error Response (Database Error)

```json
{
  "success": false,
  "message": "Database service is currently unavailable",
  "details": {
    "code": "DB_ERROR"
  }
}
```

## ⚡ Why AsyncHandler is Essential

### Without AsyncHandler - CRASHES THE APP:

```typescript
app.post("/signup", async (req, res) => {
  const user = await createUser(data); // If this fails → UNHANDLED PROMISE REJECTION
  res.json(user);
});
```

### With AsyncHandler - SAFE:

```typescript
app.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const user = await createUser(data); // If this fails → Caught and sent to error middleware
    res.json(user);
  }),
);
```

### What AsyncHandler Does:

```typescript
export const asyncHandler = (fn: AsyncController) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
    //                                    ↑
    //          This is the magic! Any rejected promise
    //          gets passed to Express error middleware
  };
};
```

## 🔄 Complete Flow Diagram

```
Request → Middleware Stack → asyncHandler(controller) → Business Logic
                                    ↓ (if error occurs)
                              Promise.catch(next)
                                    ↓
                              Express Error Router
                                    ↓
                           Global Error Middleware
                                    ↓
                              Formatted Response
                                    ↓
                                  Client
```

## 🛠️ Error Types and Status Codes

| Error Type              | HTTP Status | Description              |
| ----------------------- | ----------- | ------------------------ |
| `VALIDATION`            | 422         | Invalid input data       |
| `UNAUTHORIZED`          | 401         | Authentication required  |
| `FORBIDDEN`             | 403         | Insufficient permissions |
| `NOT_FOUND`             | 404         | Resource not found       |
| `CONFLICT`              | 409         | Resource conflict        |
| `RATE_LIMIT`            | 429         | Too many requests        |
| `DATABASE`              | 503         | Database unavailable     |
| `INTERNAL_SERVER_ERROR` | 500         | Unexpected error         |

## 🎨 Error Creation Helpers

```typescript
import { createError } from "@/middleware/error.middleware";

// Validation error with details
throw createError.validation("Email is required", { field: "email" });

// Business logic error
throw createError.badRequest("Invalid password format");

// Resource not found
throw createError.notFound("User not found");

// Authentication error
throw createError.unauthorized("Invalid credentials");

// Database error
throw createError.database("Connection failed");
```

## ✨ Benefits of This Architecture

1. **Automatic Error Catching**: No try/catch blocks needed in controllers
2. **Consistent Response Format**: All errors formatted uniformly
3. **Centralized Logging**: Single place for comprehensive error logs
4. **Type Safety**: TypeScript interfaces ensure proper error structure
5. **Development Friendly**: Stack traces and extra info in dev mode
6. **Production Ready**: Clean error messages without sensitive data
7. **Express Standard**: Follows official Express.js error handling conventions
8. **Scalable**: Easy to add new error types and handling logic

## 🚀 Best Practices

### Controllers Should:

- Use `asyncHandler` wrapper for all async route handlers
- Throw errors using `createError` helpers or error objects with `type` property
- Focus on business logic, not error response handling
- Let global middleware handle all error responses

### Services Should:

- Throw errors for business logic violations
- Not handle HTTP responses directly
- Return data or throw errors - nothing else

### Error Middleware Should:

- Be the last middleware in the Express app
- Handle all error formatting and logging
- Map error types to appropriate HTTP status codes
- Provide consistent response structure

This architecture ensures robust, maintainable, and scalable error handling across the entire application.

# What next() function does in express.js

The next() function in Express.js is a crucial callback that passes control of the request-response cycle to the next middleware function in the application's stack. It is used to ensure that the application continues processing the request, rather than leaving it hanging.
Key Functions of next()

- **Pass Control to the Next Middleware:** When a middleware function is done with its task (e.g., logging, authentication, data parsing), calling next() tells Express to move on to the next function in the sequence.
- **Prevent Requests from Hanging:** If a middleware function does not end the request-response cycle (e.g., by calling res.send() or res.end()), it must call next() to ensure the request is handled by subsequent middleware or route handlers.
- **Trigger Error Handling:** If next() is called with an argument (typically an error object, e.g., next(err)), Express regards the current request as an error and skips all subsequent non-error handling middleware, diverting control to the designated error-handling middleware (which has the signature (err, req, res, next)).
- **Skip Remaining Route Middleware:** Calling next('route') can be used within a route handler's middleware sub-stack to bypass the remaining middleware functions for the current route and move control to the next matching route definition. (This only works in functions loaded by app.METHOD() or router.METHOD()).

express.js documentation: https://expressjs.com/en/guide/error-handling.html
