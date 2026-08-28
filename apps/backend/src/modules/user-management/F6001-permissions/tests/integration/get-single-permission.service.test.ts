// Requires: DATABASE_URL pointing to a running PostgreSQL instance (docker compose up)
import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { db, closeDbPool } from "@/db/db";
import { appPermissionsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ERROR_TYPES, type ApiError } from "@/middleware/error.middleware";
import { getSinglePermissionService } from "../../services/permission.service";

let testPermissionId: number;
let seed = 0;
const uid = () => `${Date.now()}-${++seed}`;

before(async () => {
  const [permission] = await db
    .insert(appPermissionsTable)
    .values({
      name: `user-management.permission.single.${uid()}`,
      description: "seed permission for getSinglePermissionService",
    })
    .returning({ id: appPermissionsTable.id });

  testPermissionId = permission!.id;
});

after(async () => {
  await db
    .delete(appPermissionsTable)
    .where(eq(appPermissionsTable.id, testPermissionId));
  await closeDbPool();
});

test("getSinglePermissionService - returns permission by id", async () => {
  const result = await getSinglePermissionService(String(testPermissionId));

  assert.equal(result.permission.id, testPermissionId);
  assert.deepEqual(result.roles, []);
});

test("getSinglePermissionService - throws NOT_FOUND for unknown id", async () => {
  await assert.rejects(
    () => getSinglePermissionService("999999999"),
    (err: ApiError) => {
      assert.equal(err.type, ERROR_TYPES.NOT_FOUND);
      return true;
    },
  );
});
