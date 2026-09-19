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
import { updateSingleRoleService } from "../../services/role.service";

let targetRoleId: number;
let otherRoleId: number;
let firstPermissionId: number;
let secondPermissionId: number;
let targetRoleName = "";
let otherRoleName = "";
let seed = 0;
const uid = () => `${Date.now()}-${++seed}`;
// Placeholder acting-user id — these tests never touch ADMINISTRATION_ACCESS
// permissions, so the self-lockout/privilege-escalation guards are no-ops here.
const testActingUserId = "00000000-0000-0000-0000-000000000000";

before(async () => {
  const [permA] = await db
    .insert(appPermissionsTable)
    .values({
      name: `user-management.role.update.permission.a.${uid()}`,
      description: "permission A",
    })
    .returning({ id: appPermissionsTable.id });
  firstPermissionId = permA!.id;

  const [permB] = await db
    .insert(appPermissionsTable)
    .values({
      name: `user-management.role.update.permission.b.${uid()}`,
      description: "permission B",
    })
    .returning({ id: appPermissionsTable.id });
  secondPermissionId = permB!.id;

  targetRoleName = `user-management.role.update.target.${uid()}`;
  otherRoleName = `user-management.role.update.other.${uid()}`;

  const [targetRole] = await db
    .insert(appRolesTable)
    .values({
      name: targetRoleName,
      description: "target role",
    })
    .returning({ id: appRolesTable.id });
  targetRoleId = targetRole!.id;

  const [otherRole] = await db
    .insert(appRolesTable)
    .values({
      name: otherRoleName,
      description: "other role",
    })
    .returning({ id: appRolesTable.id });
  otherRoleId = otherRole!.id;

  await db.insert(appPermissionToRolesTable).values([
    { roleId: targetRoleId, permissionId: firstPermissionId },
    { roleId: otherRoleId, permissionId: secondPermissionId },
  ]);
});

after(async () => {
  await db
    .delete(appPermissionToRolesTable)
    .where(eq(appPermissionToRolesTable.roleId, targetRoleId));
  await db
    .delete(appPermissionToRolesTable)
    .where(eq(appPermissionToRolesTable.roleId, otherRoleId));

  await db.delete(appRolesTable).where(eq(appRolesTable.id, targetRoleId));
  await db.delete(appRolesTable).where(eq(appRolesTable.id, otherRoleId));

  await db
    .delete(appPermissionsTable)
    .where(eq(appPermissionsTable.id, firstPermissionId));
  await db
    .delete(appPermissionsTable)
    .where(eq(appPermissionsTable.id, secondPermissionId));

  await closeDbPool();
});

test("updateSingleRoleService - updates role and refreshes permission mappings", async () => {
  const result = await updateSingleRoleService(
    String(targetRoleId),
    {
      name: targetRoleName,
      description: "updated target description",
      permissions: [firstPermissionId, secondPermissionId],
    },
    testActingUserId,
  );

  assert.equal(result.length, 1);
  assert.equal(result[0]!.id, targetRoleId);

  const mappingA = await db
    .select()
    .from(appPermissionToRolesTable)
    .where(
      and(
        eq(appPermissionToRolesTable.roleId, targetRoleId),
        eq(appPermissionToRolesTable.permissionId, firstPermissionId),
      ),
    );
  const mappingB = await db
    .select()
    .from(appPermissionToRolesTable)
    .where(
      and(
        eq(appPermissionToRolesTable.roleId, targetRoleId),
        eq(appPermissionToRolesTable.permissionId, secondPermissionId),
      ),
    );

  assert.equal(mappingA.length, 1);
  assert.equal(mappingB.length, 1);
});

test("updateSingleRoleService - throws NOT_FOUND for unknown role id", async () => {
  await assert.rejects(
    () =>
      updateSingleRoleService(
        "999999999",
        {
          name: `role-not-found-${uid()}`,
          description: "missing role",
          permissions: [firstPermissionId],
        },
        testActingUserId,
      ),
    (err: ApiError) => {
      assert.equal(err.type, ERROR_TYPES.NOT_FOUND);
      return true;
    },
  );
});

test("updateSingleRoleService - throws VALIDATION when name belongs to another role", async () => {
  await assert.rejects(
    () =>
      updateSingleRoleService(
        String(targetRoleId),
        {
          name: otherRoleName,
          description: "duplicate name update",
          permissions: [firstPermissionId],
        },
        testActingUserId,
      ),
    (err: ApiError) => {
      assert.equal(err.type, ERROR_TYPES.VALIDATION);
      return true;
    },
  );
});

test("updateSingleRoleService - throws VALIDATION when permissions are empty", async () => {
  await assert.rejects(
    () =>
      updateSingleRoleService(
        String(targetRoleId),
        {
          name: targetRoleName,
          description: "empty permissions",
          permissions: [],
        },
        testActingUserId,
      ),
    (err: ApiError) => {
      assert.equal(err.type, ERROR_TYPES.VALIDATION);
      return true;
    },
  );
});
