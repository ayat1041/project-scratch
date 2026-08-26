import "module-alias/register";
import {
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

const appPermissionsTable = pgTable("app_permissions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 91 }).notNull().unique(),
  description: text(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export default appPermissionsTable;
