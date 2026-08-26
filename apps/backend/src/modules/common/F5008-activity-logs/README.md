# Activity Logs Module

This module provides comprehensive audit trail functionality to track all CREATE, UPDATE, and DELETE operations across the application.

## Features

- 📝 **Comprehensive Logging**: Tracks all CRUD operations with detailed information
- 👤 **User Attribution**: Records who performed each action
- 🕒 **Timestamp Tracking**: Precise timing of all operations
- 📊 **Change Tracking**: Detailed before/after values for updates
- 🌐 **Client Information**: IP address and user agent tracking
- 🔍 **Advanced Querying**: Filter and search through activity logs
- 📄 **Pagination**: Efficient handling of large datasets

## Database Schema

### `app_activity_logs` Table

| Field            | Type         | Description                           |
| ---------------- | ------------ | ------------------------------------- |
| `id`             | UUID         | Primary key                           |
| `table_name`     | VARCHAR(100) | Name of the affected table            |
| `record_id`      | VARCHAR(255) | ID of the affected record             |
| `operation_type` | VARCHAR(20)  | CREATE, UPDATE, or DELETE             |
| `user_id`        | UUID         | User who performed the action         |
| `old_values`     | JSONB        | Previous state (UPDATE/DELETE)        |
| `new_values`     | JSONB        | New state (CREATE/UPDATE)             |
| `changed_fields` | JSONB        | Array of changed field names (UPDATE) |
| `description`    | TEXT         | Human readable description            |
| `ip_address`     | VARCHAR(45)  | Client IP address                     |
| `user_agent`     | TEXT         | Client browser/app info               |
| `created_at`     | TIMESTAMP    | When the action occurred              |

## Usage

### In Services

```typescript
import {
  logCreateActivity,
  logUpdateActivity,
  logDeleteActivity,
} from "@/utils/activity-logger";

// Log CREATE operation
await logCreateActivity({
  tableName: "app_users",
  recordId: newUser.id,
  userId: userId,
  newValues: newUser,
  description: "Created new user",
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
});

// Log UPDATE operation
await logUpdateActivity({
  tableName: "app_users",
  recordId: userId,
  userId: userId,
  oldValues: existingData,
  newValues: updatedData,
  description: "Updated user details",
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
});

// Log DELETE operation
await logDeleteActivity({
  tableName: "app_roles",
  recordId: recordId,
  userId: userId,
  oldValues: deletedRecord,
  description: "Removed role",
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
});
```

### In Controllers

Use the `captureClientInfo` middleware to automatically capture IP and user agent:

```typescript
import { captureClientInfo } from "@/middleware/activity-logger.middleware";

router.use(captureClientInfo);

// In your controller, access via res.locals
const updateResult = await someService(
  recordId,
  userId,
  res.locals.clientIp, // Automatically captured
  res.locals.clientUserAgent, // Automatically captured
);
```

## API Endpoints

### Get Activity Logs

```
GET /api/activity-logs?tableName=app_users&limit=20&offset=0
```

**Query Parameters:**

- `tableName` (optional): Filter by table name
- `recordId` (optional): Filter by specific record
- `userId` (optional): Filter by user who performed action
- `operationType` (optional): CREATE, UPDATE, or DELETE
- `startDate` (optional): Filter from date (ISO string)
- `endDate` (optional): Filter to date (ISO string)
- `limit` (optional): Number of results (max 100, default 50)
- `offset` (optional): Pagination offset (default 0)

### Get User Activity Logs

```
GET /api/activity-logs/user/{userId}?limit=20&offset=0
```

### Get Record Activity Logs

```
GET /api/activity-logs/record?tableName=app_users&recordId=123e4567-e89b-12d3-a456-426614174000
```

## Integration Points

To add logging to a service:

To add logging to additional services:

1. Import the logging utilities:

   ```typescript
   import {
     logCreateActivity,
     logUpdateActivity,
     logDeleteActivity,
   } from "@/utils/activity-logger";
   ```

2. Add optional parameters for IP and user agent:

   ```typescript
   export const yourService = async (
     // ... existing parameters
     ipAddress?: string,
     userAgent?: string,
   ) => {
   ```

3. Add logging calls after database operations:

   ```typescript
   await logCreateActivity({
     tableName: "your_table_name",
     recordId: newRecord.id,
     userId: userId,
     newValues: newRecord,
     ipAddress,
     userAgent,
   });
   ```

4. Update controllers to pass client information:
   ```typescript
   await yourService(
     // ... existing parameters
     res.locals.clientIp,
     res.locals.clientUserAgent,
   );
   ```

## Security Considerations

- Activity logs are **append-only** - no updates or deletes allowed
- Sensitive data in `old_values` and `new_values` should be sanitized
- Access to activity logs should be restricted to authorized users
- Consider data retention policies for compliance

## Performance Considerations

- Activity logging is designed to be non-blocking
- Failed logging operations won't affect main business logic
- Use pagination when querying large datasets
- Consider archiving old logs for performance

## Example Response

```json
{
  "success": true,
  "message": "Activity logs retrieved successfully",
  "data": {
    "logs": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "tableName": "app_users",
        "recordId": "user-id",
        "operationType": "UPDATE",
        "userId": "user-id",
        "userName": "john.doe",
        "oldValues": { "userName": "john" },
        "newValues": { "userName": "john.doe" },
        "changedFields": ["userName"],
        "description": "Updated user",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "createdAt": "2026-01-20T10:00:00Z"
      }
    ],
    "totalCount": 1,
    "hasMore": false
  }
}
```
