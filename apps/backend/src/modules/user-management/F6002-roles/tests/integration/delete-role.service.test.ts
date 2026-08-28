// Requires: DATABASE_URL pointing to a running PostgreSQL instance (docker compose up)
import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { db, closeDbPool } from "@/db/db";
import {
  appPermissionsTable,
  appPermissionToRolesTable,
  appRolesTable,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { ERROR_TYPES, type ApiError } from "@/middleware/error.middleware";
import { deleteSingleRoleService } from "../../services/role.service";

let testRoleId: number;
let testPermissionId: number;
let seed = 0;
const uid = () => `${Date.now()}-${++seed}`;
// Placeholder acting-user id — this role is never assigned to any user in
// these tests, so the self-lockout guard is a no-op here.
const testActingUserId = "00000000-0000-0000-0000-000000000000";

before(async () => {
  const [permission] = await db
    .insert(appPermissionsTable)
    .values({
      name: `user-management.role.delete.permission.${uid()}`,
      description: "permission for deleteRoleService tests",
    })
    .returning({ id: appPermissionsTable.id });
  testPermissionId = permission!.id;

  const [role] = await db
    .insert(appRolesTable)
    .values({
      name: `user-management.role.delete.${uid()}`,
      description: "role for deleteRoleService tests",
    })
    .returning({ id: appRolesTable.id });
  testRoleId = role!.id;

  await db.insert(appPermissionToRolesTable).values({
    roleId: testRoleId,
    permissionId: testPermissionId,
  });
});

after(async () => {
  await db
    .delete(appPermissionToRolesTable)
    .where(eq(appPermissionToRolesTable.roleId, testRoleId));
  await db.delete(appRolesTable).where(eq(appRolesTable.id, testRoleId));
  await db
    .delete(appPermissionsTable)
    .where(eq(appPermissionsTable.id, testPermissionId));
  await closeDbPool();
});

test("deleteSingleRoleService - deletes role and role-permission mappings", async () => {
  await deleteSingleRoleService(String(testRoleId), testActingUserId);

  const role = await db
    .select()
    .from(appRolesTable)
    .where(eq(appRolesTable.id, testRoleId));
  const mapping = await db
    .select()
    .from(appPermissionToRolesTable)
    .where(
      and(
        eq(appPermissionToRolesTable.roleId, testRoleId),
        eq(appPermissionToRolesTable.permissionId, testPermissionId),
      ),
    );

  assert.equal(role.length, 0);
  assert.equal(mapping.length, 0);
});

test("deleteSingleRoleService - throws NOT_FOUND for unknown role id", async () => {
  await assert.rejects(
    () => deleteSingleRoleService("999999999", testActingUserId),
    (err: ApiError) => {
      assert.equal(err.type, ERROR_TYPES.NOT_FOUND);
      return true;
    },
  );
});
