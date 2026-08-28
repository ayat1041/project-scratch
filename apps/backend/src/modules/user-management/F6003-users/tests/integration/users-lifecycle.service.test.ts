// Requires: DATABASE_URL pointing to a running PostgreSQL instance (docker compose up)
import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { db, closeDbPool } from "@/db/db";
import {
  appPermissionsTable,
  appPermissionToRolesTable,
  appRolesTable,
  appUserRolesTable,
  appUsersTable,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { PERMISSIONS, ROLES } from "@repo/constants";
import { ERROR_TYPES, type ApiError } from "@/middleware/error.middleware";
import {
  bulkUpdateUserStatusService,
  createUserService,
  getUserDetailService,
  updateUserRolesService,
  updateUserStatusService,
} from "../../services/users.service";
import { listUsers } from "../../repositories/users-list.repository";

let seed = 0;
const uid = () => `${Date.now()}-${++seed}`;

let plainRoleId: number;
let adminAccessPermissionId: number;
let adminRoleId: number;
let superAdminRoleId: number;
let superAdminUserId: string;
let plainAdminUserId: string;
const createdUserIds: string[] = [];
const createdRoleIds: number[] = [];

before(async () => {
  const [plainRole] = await db
    .insert(appRolesTable)
    .values({ name: `user-guard-plain-role-${uid()}` })
    .returning({ id: appRolesTable.id });
  plainRoleId = plainRole!.id;
  createdRoleIds.push(plainRoleId);

  const [adminAccessPermission] = await db
    .insert(appPermissionsTable)
    .values({ name: PERMISSIONS.ADMIN.ADMINISTRATION_ACCESS, description: null })
    .onConflictDoNothing()
    .returning({ id: appPermissionsTable.id });
  adminAccessPermissionId =
    adminAccessPermission?.id ??
    (
      await db
        .select({ id: appPermissionsTable.id })
        .from(appPermissionsTable)
        .where(eq(appPermissionsTable.name, PERMISSIONS.ADMIN.ADMINISTRATION_ACCESS))
    )[0]!.id;

  const [adminRole] = await db
    .insert(appRolesTable)
    .values({ name: `user-guard-admin-role-${uid()}` })
    .returning({ id: appRolesTable.id });
  adminRoleId = adminRole!.id;
  createdRoleIds.push(adminRoleId);
  await db.insert(appPermissionToRolesTable).values({ roleId: adminRoleId, permissionId: adminAccessPermissionId });

  const [superAdminRole] = await db
    .insert(appRolesTable)
    .values({ name: ROLES.SUPER_ADMIN })
    .onConflictDoNothing()
    .returning({ id: appRolesTable.id });
  superAdminRoleId =
    superAdminRole?.id ??
    (
      await db
        .select({ id: appRolesTable.id })
        .from(appRolesTable)
        .where(eq(appRolesTable.name, ROLES.SUPER_ADMIN))
    )[0]!.id;

  const [superAdminUser] = await db
    .insert(appUsersTable)
    .values({
      email: `user-guard-super-${uid()}@example.test`,
      password: "hashed",
      userName: `user-guard-super-${uid()}`,
      providerName: "email",
    })
    .returning({ id: appUsersTable.id });
  superAdminUserId = superAdminUser!.id;
  createdUserIds.push(superAdminUserId);
  await db.insert(appUserRolesTable).values({ userId: superAdminUserId, roleId: superAdminRoleId });

  const [plainAdminUser] = await db
    .insert(appUsersTable)
    .values({
      email: `user-guard-plain-admin-${uid()}@example.test`,
      password: "hashed",
      userName: `user-guard-plain-admin-${uid()}`,
      providerName: "email",
    })
    .returning({ id: appUsersTable.id });
  plainAdminUserId = plainAdminUser!.id;
  createdUserIds.push(plainAdminUserId);
  await db.insert(appUserRolesTable).values({ userId: plainAdminUserId, roleId: adminRoleId });
});

after(async () => {
  for (const userId of createdUserIds) {
    await db.delete(appUserRolesTable).where(eq(appUserRolesTable.userId, userId));
    await db.delete(appUsersTable).where(eq(appUsersTable.id, userId));
  }
  for (const roleId of createdRoleIds) {
    await db.delete(appPermissionToRolesTable).where(eq(appPermissionToRolesTable.roleId, roleId));
    await db.delete(appRolesTable).where(eq(appRolesTable.id, roleId));
  }
  // Never delete ADMINISTRATION_ACCESS itself — it's a real, permanent system
  // permission shared by every test file (and the live app), not test-owned data.
  await closeDbPool();
});

test("user lifecycle - create, list, get, reassign roles, deactivate, reactivate", async () => {
  const email = `user-lifecycle-${uid()}@example.test`;
  const created = await createUserService(
    { email, name: `Lifecycle User ${uid()}`, password: "Str0ngP@ssword!", roleIds: [plainRoleId] },
    superAdminUserId,
  );
  createdUserIds.push(created.id);

  assert.equal(created.email, email);
  assert.equal(created.isVerified, true, "admin-created accounts are pre-verified");
  assert.equal(created.userOrigin, "admin_created");
  assert.equal(created.roles.length, 1);
  assert.equal(created.roles[0]!.id, plainRoleId);

  const { rows } = await listUsers({ status: "active", limit: 50, offset: 0 });
  assert.equal(rows.some((row) => row.id === created.id), true);

  const detail = await getUserDetailService(created.id);
  assert.equal(detail.email, email);

  const withSecondRole = await updateUserRolesService(created.id, [plainRoleId, adminRoleId], superAdminUserId);
  assert.equal(withSecondRole.roles.length, 2);

  const deactivated = await updateUserStatusService(created.id, true, superAdminUserId);
  assert.equal(deactivated.isDeleted, true);

  const reactivated = await updateUserStatusService(created.id, false, superAdminUserId);
  assert.equal(reactivated.isDeleted, false);
});

test("createUserService - a non-super-admin cannot grant the super_admin role", async () => {
  await assert.rejects(
    () =>
      createUserService(
        {
          email: `user-guard-escalation-${uid()}@example.test`,
          name: `Escalation Attempt ${uid()}`,
          password: "Str0ngP@ssword!",
          roleIds: [superAdminRoleId],
        },
        plainAdminUserId,
      ),
    (err: ApiError) => {
      assert.equal(err.type, ERROR_TYPES.FORBIDDEN);
      return true;
    },
  );
});

test("updateUserStatusService - blocks deactivating your own account", async () => {
  await assert.rejects(
    () => updateUserStatusService(plainAdminUserId, true, plainAdminUserId),
    (err: ApiError) => {
      assert.equal(err.type, ERROR_TYPES.VALIDATION);
      return true;
    },
  );
});

test("updateUserRolesService - blocks removing your own only admin-granting role", async () => {
  await assert.rejects(
    () => updateUserRolesService(plainAdminUserId, [plainRoleId], plainAdminUserId),
    (err: ApiError) => {
      assert.equal(err.type, ERROR_TYPES.VALIDATION);
      return true;
    },
  );
});

test("bulkUpdateUserStatusService - blocks deactivating your own account in a bulk request", async () => {
  await assert.rejects(
    () => bulkUpdateUserStatusService([plainAdminUserId], true, plainAdminUserId),
    (err: ApiError) => {
      assert.equal(err.type, ERROR_TYPES.VALIDATION);
      return true;
    },
  );
});
