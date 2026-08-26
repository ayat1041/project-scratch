# Error Handling Migration Guide

## Overview

The error handling system has been improved to follow Express.js best practices with a global error middleware pattern.

## Key Changes

### 1. New Error Middleware Location

- **Old**: `@/utils/errorHandler`
- **New**: `@/middleware/error.middleware`

### 2. Simplified Async Handler

The `asyncHandler` now follows the standard Express pattern:

- Catches Promise rejections
- Passes errors to `next()` middleware instead of handling responses directly
- Global error middleware handles all error responses

### 3. New Error Creation Helpers

```typescript
import { createError } from "@/middleware/error.middleware";

// Instead of throwing plain objects, use helpers:
throw createError.badRequest("Invalid password");
throw createError.notFound("User not found");
throw createError.validation("Email is required", { field: "email" });
```

### 4. Controller Pattern

```typescript
export const myController = asyncHandler(
  async (req: Request, res: Response) => {
    // Validation
    const data = await validateZodSchema(mySchema)(req.body);

    // Business logic - just throw errors, don't handle responses
    if (!data.email) {
      throw createError.badRequest("Email is required");
    }

    // Success response
    res.status(200).json({
      success: true,
      data: result,
    });
  },
);
```

## Migration Steps

### Step 1: Update Imports

```typescript
// Old
import { ERROR_TYPES, handleError } from "@/utils/errorHandler";

// New
import { ERROR_TYPES, createError } from "@/middleware/error.middleware";
```

### Step 2: Remove Manual Error Handling

```typescript
// Old
try {
  // logic
} catch (error) {
  handleError(error, res, "Context");
}

// New - use asyncHandler and throw errors
export const controller = asyncHandler(async (req, res) => {
  // logic - just throw errors, asyncHandler catches them
  throw createError.badRequest("Something went wrong");
});
```

### Step 3: Update Services

Services should throw errors, not handle responses:

```typescript
// Old
export const myService = (data: any, res: Response) => {
  if (!data.id) {
    return handleError(
      { type: ERROR_TYPES.VALIDATION, message: "ID required" },
      res,
    );
  }
  // logic
};

// New
export const myService = (data: any) => {
  if (!data.id) {
    throw createError.validation("ID required");
  }
  // logic
};
```

## Benefits

1. **Cleaner Code**: No try/catch blocks in controllers
2. **Consistent Error Format**: All errors handled by one middleware
3. **Better Separation of Concerns**: Services handle business logic, middleware handles HTTP responses
4. **Express Standard**: Follows Express.js error handling conventions
5. **Better Logging**: Centralized error logging with request context

## Backward Compatibility

The old `@/utils/errorHandler` still exports `ERROR_TYPES` for backward compatibility, but the `handleError` function is deprecated. Gradually migrate files to use the new pattern.
