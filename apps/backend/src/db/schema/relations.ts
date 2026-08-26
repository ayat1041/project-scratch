import "module-alias/register";
import { relations } from "drizzle-orm";
import appUsersTable from "@/db/schema/user-management/app_users";
import appRolesTable from "@/db/schema/user-management/app_roles";
import appUserRolesTable from "@/db/schema/user-management/app_user_roles";

// Relations for appUsersTable
export const usersTableRelations = relations(appUsersTable, ({ many }) => ({
  userRoles: many(appUserRolesTable),
}));

// Relations for appRolesTable
export const rolesTableRelations = relations(appRolesTable, ({ many }) => ({
  userRoles: many(appUserRolesTable),
}));

// Relations for appUserRolesTable (junction table)
export const userRolesTableRelations = relations(
  appUserRolesTable,
  ({ one }) => ({
    user: one(appUsersTable, {
      fields: [appUserRolesTable.userId],
      references: [appUsersTable.id],
    }),
    role: one(appRolesTable, {
      fields: [appUserRolesTable.roleId],
      references: [appRolesTable.id],
    }),
  }),
);
