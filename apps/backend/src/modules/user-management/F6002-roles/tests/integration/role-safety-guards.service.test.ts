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
  createRoleService,
  deleteSingleRoleService,
  updateSingleRoleService,
} from "../../services/role.service";

let seed = 0;
const uid = () => `${Date.now()}-${++seed}`;

let adminAccessPermissionId: number;
let plainUserId: string;
let superAdminUserId: string;
const createdRoleIds: number[] = [];
const createdUserIds: string[] = [];

before(async () => {
  const [adminAccessPermission] = await db
    .insert(appPermissionsTable)
    .values({
      name: PERMISSIONS.ADMIN.ADMINISTRATION_ACCESS,
      description: "seeded for role-safety-guards tests",
    })
    .onConflictDoNothing()
    .returning({ id: appPermissionsTable.id });

  if (adminAccessPermission) {
    adminAccessPermissionId = adminAccessPermission.id;
  } else {
    const [existing] = await db
      .select({ id: appPermissionsTable.id })
      .from(appPermissionsTable)
      .where(eq(appPermissionsTable.name, PERMISSIONS.ADMIN.ADMINISTRATION_ACCESS));
    adminAccessPermissionId = existing!.id;
  }

  const [superAdminRole] = await db
    .insert(appRolesTable)
    .values({ name: ROLES.SUPER_ADMIN })
    .onConflictDoNothing()
    .returning({ id: appRolesTable.id });

  const superAdminRoleId =
    superAdminRole?.id ??
    (
      await db
        .select({ id: appRolesTable.id })
        .from(appRolesTable)
        .where(eq(appRolesTable.name, ROLES.SUPER_ADMIN))
    )[0]!.id;

  const [plainUser] = await db
    .insert(appUsersTable)
    .values({
      email: `role-guard-plain-${uid()}@example.test`,
      password: "hashed",
      userName: `role-guard-plain-${uid()}`,
      providerName: "email",
    })
    .returning({ id: appUsersTable.id });
  plainUserId = plainUser!.id;
  createdUserIds.push(plainUserId);

  const [superAdminUser] = await db
    .insert(appUsersTable)
    .values({
      email: `role-guard-super-${uid()}@example.test`,
      password: "hashed",
      userName: `role-guard-super-${uid()}`,
      providerName: "email",
    })
    .returning({ id: appUsersTable.id });
  superAdminUserId = superAdminUser!.id;
  createdUserIds.push(superAdminUserId);

  await db.insert(appUserRolesTable).values({
    userId: superAdminUserId,
    roleId: superAdminRoleId,
  });
});

after(async () => {
  await db
    .delete(appUserRolesTable)
    .where(eq(appUserRolesTable.userId, superAdminUserId));
  for (const roleId of createdRoleIds) {
    await db
      .delete(appPermissionToRolesTable)
      .where(eq(appPermissionToRolesTable.roleId, roleId));
    await db
      .delete(appUserRolesTable)
      .where(eq(appUserRolesTable.roleId, roleId));
    await db.delete(appRolesTable).where(eq(appRolesTable.id, roleId));
  }
  for (const userId of createdUserIds) {
    await db.delete(appUsersTable).where(eq(appUsersTable.id, userId));
  }
  await closeDbPool();
});

test("createRoleService - a non-super-admin cannot create a role granting ADMINISTRATION_ACCESS", async () => {
  await assert.rejects(
    () =>
      createRoleService(
        {
          name: `role-guard-escalation-${uid()}`,
          description: "attempted privilege escalation",
          permissions: [adminAccessPermissionId],
        },
        plainUserId,
      ),
    (err: ApiError) => {
      assert.equal(err.type, ERROR_TYPES.FORBIDDEN);
      return true;
    },
  );
});

test("createRoleService - a super admin can create a role granting ADMINISTRATION_ACCESS", async () => {
  const created = await createRoleService(
    {
      name: `role-guard-allowed-${uid()}`,
      description: "granted by a super admin",
      permissions: [adminAccessPermissionId],
    },
    superAdminUserId,
  );
  createdRoleIds.push(created[0]!.id);
  assert.equal(created.length, 1);
});

test("updateSingleRoleService - blocks self-lockout when it is the acting user's only admin role", async () => {
  const roleName = `role-guard-lockout-${uid()}`;
  const created = await createRoleService(
    { name: roleName, description: "lockout target", permissions: [adminAccessPermissionId] },
    superAdminUserId,
  );
  const roleId = created[0]!.id;
  createdRoleIds.push(roleId);

  const [otherPermission] = await db
    .insert(appPermissionsTable)
    .values({ name: `role-guard-other-permission-${uid()}`, description: null })
    .returning({ id: appPermissionsTable.id });

  // Assign the lockout-target role to a fresh user who has no other admin role.
  const [lockoutUser] = await db
    .insert(appUsersTable)
    .values({
      email: `role-guard-lockout-${uid()}@example.test`,
      password: "hashed",
      userName: `role-guard-lockout-${uid()}`,
      providerName: "email",
    })
    .returning({ id: appUsersTable.id });
  createdUserIds.push(lockoutUser!.id);
  await db.insert(appUserRolesTable).values({ userId: lockoutUser!.id, roleId });

  await assert.rejects(
    () =>
      updateSingleRoleService(
        String(roleId),
        { name: roleName, description: "stripping admin access", permissions: [otherPermission!.id] },
        lockoutUser!.id,
      ),
    (err: ApiError) => {
      assert.equal(err.type, ERROR_TYPES.VALIDATION);
      return true;
    },
  );
});

test("deleteSingleRoleService - blocks deleting a system role", async () => {
  const [systemRole] = await db
    .insert(appRolesTable)
    .values({
      name: `role-guard-system-${uid()}`,
      description: "protected system role",
      isSystemRole: true,
    })
    .returning({ id: appRolesTable.id });
  createdRoleIds.push(systemRole!.id);

  await assert.rejects(
    () => deleteSingleRoleService(String(systemRole!.id), superAdminUserId),
    (err: ApiError) => {
      assert.equal(err.type, ERROR_TYPES.CONFLICT);
      return true;
    },
  );
});
