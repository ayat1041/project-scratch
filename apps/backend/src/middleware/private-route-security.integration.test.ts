import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import { randomUUID } from "node:crypto";

import request from "supertest";
import { eq } from "drizzle-orm";

process.env.CSRF_SECRET ??= "test-csrf-secret-for-route-security";
process.env.JWT_SECRET ??= "test-jwt-secret-for-route-security";
process.env.NODE_ENV ??= "test";

type App = import("express").Application;
type Db = typeof import("@/db/db").db;
type Schema = typeof import("@/db/schema");
type Encrypt = typeof import("@/lib/auth.utils").encrypt;
type GenerateCsrfToken = typeof import("@/lib/csrf.utils").generateCsrfToken;

const DUMMY_PASSWORD_HASH =
  "$2a$12$N6DFn/fR44Dik.ybgR5MXOg5nM/Uy2HKarYKVrMIACOW9icv1XBhe";

let app: App;
let db: Db;
let schema: Schema;
let closeDbPool: () => Promise<void>;
let encrypt: Encrypt;
let generateCsrfToken: GenerateCsrfToken;
let sessionTokenName: string;
let sessionTokenAge: string;
let sessionCookieMaxAge: number;
let csrfTokenName: string;
let noPermissionRoleId: number;

const createdUserIds: string[] = [];
const createdRoleIds: number[] = [];
const createdPermissionIds: number[] = [];
const createdSessionJtis: string[] = [];

let seed = 0;
const uid = () => `${Date.now()}-${++seed}-${randomUUID().slice(0, 8)}`;

before(async () => {
  const dbModule = await import("@/db/db");
  const appModule = await import("@/app/app");
  const authUtils = await import("@/lib/auth.utils");
  const csrfUtils = await import("@/lib/csrf.utils");
  const variables = await import("@/constants/variables");

  db = dbModule.db;
  closeDbPool = dbModule.closeDbPool;
  schema = await import("@/db/schema");
  encrypt = authUtils.encrypt;
  generateCsrfToken = csrfUtils.generateCsrfToken;
  sessionTokenName = variables.SESSION_TOKEN_NAME;
  sessionTokenAge = variables.SESSION_TOKEN_AGE;
  sessionCookieMaxAge = variables.SESSION_COOKIE_MAX_AGE;
  csrfTokenName = variables.CSRF_TOKEN_NAME;
  app = appModule.createApp();

  noPermissionRoleId = await createRole([]);
});

after(async () => {
  if (!db || !schema) return;

  const redisClient = (await import("@/infrastructure/cache/redis-client"))
    .default;

  for (const userId of createdUserIds) {
    await redisClient.del(`user:permissions:${userId}`);
  }

  for (const jti of createdSessionJtis) {
    await db
      .delete(schema.appUserRefreshTokensTable)
      .where(eq(schema.appUserRefreshTokensTable.jti, jti));
  }

  for (const userId of createdUserIds) {
    await db
      .delete(schema.appUserRolesTable)
      .where(eq(schema.appUserRolesTable.userId, userId));
  }

  for (const roleId of createdRoleIds) {
    await db
      .delete(schema.appPermissionToRolesTable)
      .where(eq(schema.appPermissionToRolesTable.roleId, roleId));
  }

  for (const roleId of createdRoleIds) {
    await db
      .delete(schema.appRolesTable)
      .where(eq(schema.appRolesTable.id, roleId));
  }

  for (const permissionId of createdPermissionIds) {
    await db
      .delete(schema.appPermissionsTable)
      .where(eq(schema.appPermissionsTable.id, permissionId));
  }

  for (const userId of createdUserIds) {
    await db
      .delete(schema.appUsersTable)
      .where(eq(schema.appUsersTable.id, userId));
  }

  await redisClient.disconnect();
  await closeDbPool();
});

async function ensurePermission(permissionName: string): Promise<number> {
  const [existingPermission] = await db
    .select({ id: schema.appPermissionsTable.id })
    .from(schema.appPermissionsTable)
    .where(eq(schema.appPermissionsTable.name, permissionName))
    .limit(1);

  if (existingPermission) return existingPermission.id;

  const [createdPermission] = await db
    .insert(schema.appPermissionsTable)
    .values({ name: permissionName })
    .onConflictDoNothing()
    .returning({ id: schema.appPermissionsTable.id });

  if (createdPermission) {
    createdPermissionIds.push(createdPermission.id);
    return createdPermission.id;
  }

  const [permissionAfterConflict] = await db
    .select({ id: schema.appPermissionsTable.id })
    .from(schema.appPermissionsTable)
    .where(eq(schema.appPermissionsTable.name, permissionName))
    .limit(1);

  assert.ok(permissionAfterConflict);
  return permissionAfterConflict.id;
}

async function createRole(permissionNames: string[]): Promise<number> {
  const [role] = await db
    .insert(schema.appRolesTable)
    .values({
      name: `route-security-role-${uid()}`,
      description: "Temporary route security test role",
      scope: "test",
    })
    .returning({ id: schema.appRolesTable.id });

  assert.ok(role);
  createdRoleIds.push(role.id);

  for (const permissionName of permissionNames) {
    const permissionId = await ensurePermission(permissionName);
    await db
      .insert(schema.appPermissionToRolesTable)
      .values({ roleId: role.id, permissionId })
      .onConflictDoNothing();
  }

  return role.id;
}

async function createUser(roleId?: number): Promise<{
  id: string;
  email: string;
}> {
  const testId = uid();
  const [user] = await db
    .insert(schema.appUsersTable)
    .values({
      email: `route-security-${testId}@example.com`,
      userName: `route-security-${testId}`,
      password: DUMMY_PASSWORD_HASH,
      providerName: "email",
      isVerified: true,
      registeredAt: new Date(),
    })
    .returning({
      id: schema.appUsersTable.id,
      email: schema.appUsersTable.email,
    });

  assert.ok(user);
  createdUserIds.push(user.id);

  if (roleId !== undefined) {
    await db
      .insert(schema.appUserRolesTable)
      .values({ userId: user.id, roleId })
      .onConflictDoNothing();
  }

  return user;
}

async function createSessionCookies(user: {
  id: string;
  email: string;
}): Promise<{
  csrf: string;
  cookies: string[];
}> {
  const jti = randomUUID();
  const familyId = randomUUID();

  await db.insert(schema.appUserRefreshTokensTable).values({
    jti,
    familyId,
    userId: user.id,
    expiresAt: new Date(Date.now() + sessionCookieMaxAge),
    ip: "127.0.0.1",
    deviceInfo: "{}",
  });
  createdSessionJtis.push(jti);

  const sessionToken = await encrypt(
    { id: user.id, email: user.email, jti, familyId },
    sessionTokenAge,
  );
  const csrf = generateCsrfToken(user.id);

  return {
    csrf,
    cookies: [
      `${sessionTokenName}=${sessionToken}`,
      `${csrfTokenName}=${csrf}`,
    ],
  };
}

test("private routes reject unauthenticated requests before controller execution", async () => {
  const response = await request(app)
    .get("/api/auth/v1/session-info")
    .set("x-site-context", "main");

  assert.equal(response.status, 401, response.text);
});

test("private mutation routes reject authenticated requests without CSRF proof", async () => {
  const user = await createUser();
  const { cookies } = await createSessionCookies(user);

  const response = await request(app)
    .post("/api/auth/v1/sign-out")
    .set("Cookie", [cookies[0]!]);

  assert.equal(response.status, 403, response.text);
});

test("admin routes reject authenticated users without admin permissions", async () => {
  const user = await createUser(noPermissionRoleId);
  const { cookies } = await createSessionCookies(user);

  const response = await request(app)
    .get("/api/user-management/v1/roles")
    .set("x-site-context", "admin")
    .set("Cookie", cookies);

  assert.equal(response.status, 403, response.text);
});
