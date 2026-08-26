import "module-alias/register";
import {
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";

const appRolesTable = pgTable("app_roles", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 91 }).notNull().unique(),
  description: text(),
  scope: varchar({ length: 50 }).notNull().default("platform"),
  isSystemRole: boolean("is_system_role").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export default appRolesTable;
