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
import { createRoleService } from "../../services/role.service";

let testPermissionId: number;
const createdRoleIds: number[] = [];
let seed = 0;
const uid = () => `${Date.now()}-${++seed}`;

before(async () => {
  const [permission] = await db
    .insert(appPermissionsTable)
    .values({
      name: `user-management.role.create.permission.${uid()}`,
      description: "permission for createRoleService tests",
    })
    .returning({ id: appPermissionsTable.id });

  testPermissionId = permission!.id;
});

after(async () => {
  for (const roleId of createdRoleIds) {
    await db
      .delete(appPermissionToRolesTable)
      .where(eq(appPermissionToRolesTable.roleId, roleId));
    await db.delete(appRolesTable).where(eq(appRolesTable.id, roleId));
  }

  await db
    .delete(appPermissionsTable)
    .where(eq(appPermissionsTable.id, testPermissionId));
  await closeDbPool();
});

test("createRoleService - creates role and role-permission mappings", async () => {
  const roleName = `user-management.role.create.${uid()}`;

  const created = await createRoleService({
    name: roleName,
    description: "created in integration test",
    permissions: [testPermissionId],
  });

  assert.equal(created.length, 1);
  const roleId = created[0]!.id;
  createdRoleIds.push(roleId);

  const rolePermission = await db
    .select()
    .from(appPermissionToRolesTable)
    .where(
      and(
        eq(appPermissionToRolesTable.roleId, roleId),
        eq(appPermissionToRolesTable.permissionId, testPermissionId),
      ),
    );

  assert.equal(rolePermission.length, 1);
});

test("createRoleService - throws VALIDATION when role name already exists", async () => {
  const roleName = `user-management.role.duplicate.${uid()}`;
  const first = await createRoleService({
    name: roleName,
    description: "first role",
    permissions: [testPermissionId],
  });
  createdRoleIds.push(first[0]!.id);

  await assert.rejects(
    () =>
      createRoleService({
        name: roleName,
        description: "duplicate role",
        permissions: [testPermissionId],
      }),
    (err: ApiError) => {
      assert.equal(err.type, ERROR_TYPES.VALIDATION);
      return true;
    },
  );
});

test("createRoleService - throws VALIDATION when permissions are empty", async () => {
  await assert.rejects(
    () =>
      createRoleService({
        name: `user-management.role.no-permissions.${uid()}`,
        description: "invalid role",
        permissions: [],
      }),
    (err: ApiError) => {
      assert.equal(err.type, ERROR_TYPES.VALIDATION);
      return true;
    },
  );
});
