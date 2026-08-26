import {
  pgTable,
  timestamp,
  uuid,
  varchar,
  text,
  jsonb,
} from "drizzle-orm/pg-core";
import appUsersTable from "../user-management/app_users";

const appActivityLogs = pgTable("app_activity_logs", {
  id: uuid().primaryKey().defaultRandom(),

  // What was affected
  tableName: varchar("table_name", { length: 100 }).notNull(),
  recordId: varchar("record_id", { length: 255 }).notNull(), // Using varchar to handle different ID types

  // What operation was performed
  operationType: varchar("operation_type", { length: 20 }).notNull(), // CREATE, UPDATE, DELETE

  // Who performed the action
  userId: uuid("user_id")
    .notNull()
    .references(() => appUsersTable.id),

  // What changed
  oldValues: jsonb("old_values"), // Previous state for UPDATE/DELETE operations
  newValues: jsonb("new_values"), // New state for CREATE/UPDATE operations
  changedFields: jsonb("changed_fields"), // Array of field names that changed (for UPDATE operations)

  source: text("source"), // Source of the change (e.g., controller/endpoint)

  // Additional context
  description: text("description"), // Human readable description of the change
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4/IPv6 address
  userAgent: text("user_agent"), // Browser/client info

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export default appActivityLogs;
