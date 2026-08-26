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
import { listAllRolesService } from "../../services/role.service";

let seededRoleIds: number[] = [];
let seededPermissionIds: number[] = [];
let searchToken = "";
let seed = 0;
const uid = () => `${Date.now()}-${++seed}`;

before(async () => {
  searchToken = `search-${uid()}`;

  const permissions = await db
    .insert(appPermissionsTable)
    .values([
      {
        name: `user-management.role.list.permission.${searchToken}.a`,
        description: "permission A",
      },
      {
        name: `user-management.role.list.permission.${searchToken}.b`,
        description: "permission B",
      },
    ])
    .returning({ id: appPermissionsTable.id });
  seededPermissionIds = permissions.map((row) => row.id);

  const roles = await db
    .insert(appRolesTable)
    .values([
      {
        name: `user-management.role.list.${searchToken}.a`,
        description: "role A",
      },
      {
        name: `user-management.role.list.${searchToken}.b`,
        description: "role B",
      },
    ])
    .returning({ id: appRolesTable.id });
  seededRoleIds = roles.map((row) => row.id);

  await db.insert(appPermissionToRolesTable).values([
    { roleId: seededRoleIds[0]!, permissionId: seededPermissionIds[0]! },
    { roleId: seededRoleIds[1]!, permissionId: seededPermissionIds[1]! },
  ]);
});

after(async () => {
  for (const roleId of seededRoleIds) {
    await db
      .delete(appPermissionToRolesTable)
      .where(eq(appPermissionToRolesTable.roleId, roleId));
    await db.delete(appRolesTable).where(eq(appRolesTable.id, roleId));
  }

  for (const permissionId of seededPermissionIds) {
    await db
      .delete(appPermissionsTable)
      .where(eq(appPermissionsTable.id, permissionId));
  }

  await closeDbPool();
});

test("listAllRolesService - returns paginated role list", async () => {
  const result = await listAllRolesService({
    limit: 1,
    offset: 0,
    sort: "desc",
  });

  assert.ok(Array.isArray(result.results));
  assert.equal(result.results.length, 1);
  assert.ok(result.total >= seededRoleIds.length);
});

test("listAllRolesService - applies search filter", async () => {
  const result = await listAllRolesService({
    limit: 10,
    offset: 0,
    sort: "desc",
    search: searchToken,
  });

  assert.ok(result.results.length >= 1);
  for (const row of result.results) {
    assert.ok(String(row.name).includes(searchToken));
  }
});
