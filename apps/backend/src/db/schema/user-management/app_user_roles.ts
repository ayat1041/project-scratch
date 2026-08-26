import "module-alias/register";
import {
  integer,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
  index,
} from "drizzle-orm/pg-core";
import appUsersTable from "@/db/schema/user-management/app_users";
import appRolesTable from "@/db/schema/user-management/app_roles";

const appUserRolesTable = pgTable(
  "app_user_roles",
  {
    userId: uuid("user_id")
      .references(() => appUsersTable.id, { onDelete: "cascade" })
      .notNull(),
    roleId: integer("role_id")
      .references(() => appRolesTable.id, { onDelete: "cascade" })
      .notNull(),
    assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.roleId] }),
    // Indexes for better join performance
    userIdIdx: index("idx_user_roles_user_id").on(table.userId),
    roleIdIdx: index("idx_user_roles_role_id").on(table.roleId),
  }),
);

export default appUserRolesTable;
