// Requires: DATABASE_URL pointing to a running PostgreSQL instance (docker compose up)
import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { db, closeDbPool } from "@/db/db";
import {
  appPermissionsTable,
  appPermissionToRolesTable,
  appRolesTable,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { ERROR_TYPES, type ApiError } from "@/middleware/error.middleware";
import { getSingleRoleService } from "../../services/role.service";

let testRoleId: number;
let testPermissionId: number;
let seed = 0;
const uid = () => `${Date.now()}-${++seed}`;

before(async () => {
  const [permission] = await db
    .insert(appPermissionsTable)
    .values({
      name: `user-management.role.single.permission.${uid()}`,
      description: "permission for getSingleRoleService tests",
    })
    .returning({ id: appPermissionsTable.id });
  testPermissionId = permission!.id;

  const [role] = await db
    .insert(appRolesTable)
    .values({
      name: `user-management.role.single.${uid()}`,
      description: "role for getSingleRoleService tests",
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

test("getSingleRoleService - returns role with permission list", async () => {
  const result = await getSingleRoleService(String(testRoleId));

  assert.equal(result.role.id, testRoleId);
  assert.ok(Array.isArray(result.permissions));
  assert.equal(result.permissions.length, 1);
  assert.equal(result.permissions[0]!.id, testPermissionId);
});

test("getSingleRoleService - throws NOT_FOUND when role does not exist", async () => {
  await assert.rejects(
    () => getSingleRoleService("999999999"),
    (err: ApiError) => {
      assert.equal(err.type, ERROR_TYPES.NOT_FOUND);
      return true;
    },
  );
});
