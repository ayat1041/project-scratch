import "module-alias/register";
import { integer, pgTable, unique, index } from "drizzle-orm/pg-core";
import appRolesTable from "@/db/schema/user-management/app_roles";
import appPermissionsTable from "@/db/schema/user-management/app_permissions";

const appPermissionToRolesTable = pgTable(
  "app_permission_to_roles",
  {
    permissionId: integer("permission_id").references(
      () => appPermissionsTable.id,
    ),
    roleId: integer("role_id").references(() => appRolesTable.id),
  },
  (t) => ({
    unq: unique().on(t.permissionId, t.roleId),
    // Indexes for permission lookups
    roleIdIdx: index("idx_permission_roles_role_id").on(t.roleId),
    permissionIdIdx: index("idx_permission_roles_permission_id").on(
      t.permissionId,
    ),
  }),
);
export default appPermissionToRolesTable;
