import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import { randomUUID } from "node:crypto";

import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import request from "supertest";

process.env.CSRF_SECRET ??= "test-csrf-secret-for-auth-security-regression";
process.env.JWT_SECRET ??= "test-jwt-secret-for-auth-security-regression";
process.env.NODE_ENV ??= "test";

type App = import("express").Application;
type Db = typeof import("@/db/db").db;
type Schema = typeof import("@/db/schema");
type Encrypt = typeof import("@/lib/auth.utils").encrypt;
type GenerateCsrfToken = typeof import("@/lib/csrf.utils").generateCsrfToken;

const DUMMY_PASSWORD_HASH =
  "$2a$12$N6DFn/fR44Dik.ybgR5MXOg5nM/Uy2HKarYKVrMIACOW9icv1XBhe";
const VALID_PASSWORD = "ValidPassword123!";
const NEW_PASSWORD = "NewPassword123!";
const AUTH_BASE_URL = "/api/auth/v1";

let app: App;
let db: Db;
let schema: Schema;
let closeDbPool: () => Promise<void>;
let encrypt: Encrypt;
let generateCsrfToken: GenerateCsrfToken;
let sessionTokenName: string;
let csrfTokenName: string;
let csrfHeaderName: string;

const createdUserIds: string[] = [];
const createdRoleIds: number[] = [];
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
  csrfTokenName = variables.CSRF_TOKEN_NAME;
  csrfHeaderName = variables.CSRF_HEADER_NAME;
  app = appModule.createApp();
});

after(async () => {
  if (!db || !schema) return;

  const redisClient = (await import("@/infrastructure/cache/redis-client"))
    .default;

  for (const userId of createdUserIds) {
    await redisClient.del(`user:permissions:${userId}`);
  }

  for (const userId of createdUserIds) {
    await db
      .delete(schema.appEmailVerificationTokensTable)
      .where(eq(schema.appEmailVerificationTokensTable.userId, userId));
  }

  for (const jti of createdSessionJtis) {
    await db
      .delete(schema.appUserRefreshTokensTable)
      .where(eq(schema.appUserRefreshTokensTable.jti, jti));
  }

  for (const userId of createdUserIds) {
    await db
      .delete(schema.appActivityLogsTable)
      .where(eq(schema.appActivityLogsTable.userId, userId));
  }

  for (const userId of createdUserIds) {
    await db
      .delete(schema.appUserRolesTable)
      .where(eq(schema.appUserRolesTable.userId, userId));
  }

  for (const roleId of createdRoleIds) {
    await db
      .delete(schema.appRolesTable)
      .where(eq(schema.appRolesTable.id, roleId));
  }

  for (const userId of createdUserIds) {
    await db
      .delete(schema.appUsersTable)
      .where(eq(schema.appUsersTable.id, userId));
  }

  await redisClient.disconnect();
  await closeDbPool();
});

async function ensureRole(roleName: string): Promise<number> {
  const [existingRole] = await db
    .select({ id: schema.appRolesTable.id })
    .from(schema.appRolesTable)
    .where(eq(schema.appRolesTable.name, roleName))
    .limit(1);

  if (existingRole) return existingRole.id;

  const [createdRole] = await db
    .insert(schema.appRolesTable)
    .values({
      name: roleName,
      description: "Temporary auth security regression role",
      scope: "test",
    })
    .returning({ id: schema.appRolesTable.id });

  assert.ok(createdRole);
  createdRoleIds.push(createdRole.id);
  return createdRole.id;
}

async function createUser(
  options: {
    email?: string;
    isVerified?: boolean;
    roleNames?: string[];
  } = {},
): Promise<{ id: string; email: string }> {
  const testId = uid();
  const [user] = await db
    .insert(schema.appUsersTable)
    .values({
      email: options.email ?? `auth-security-${testId}@example.com`,
      userName: `auth-security-${testId}`,
      password: DUMMY_PASSWORD_HASH,
      providerName: "email",
      isVerified: options.isVerified ?? true,
      registeredAt: new Date(),
    })
    .returning({
      id: schema.appUsersTable.id,
      email: schema.appUsersTable.email,
    });

  assert.ok(user);
  createdUserIds.push(user.id);

  for (const roleName of options.roleNames ?? []) {
    const roleId = await ensureRole(roleName);
    await db
      .insert(schema.appUserRolesTable)
      .values({ userId: user.id, roleId })
      .onConflictDoNothing();
  }

  return user;
}

async function createSession(options: {
  userId: string;
  email: string;
  familyId?: string;
  rotatedTo?: string;
}): Promise<{ jti: string; familyId: string; token: string }> {
  const jti = randomUUID();
  const familyId = options.familyId ?? randomUUID();

  await db.insert(schema.appUserRefreshTokensTable).values({
    jti,
    familyId,
    userId: options.userId,
    rotatedTo: options.rotatedTo,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    ip: "127.0.0.1",
    deviceInfo: "{}",
  });

  createdSessionJtis.push(jti);

  const token = await encrypt(
    {
      id: options.userId,
      email: options.email,
      jti,
      familyId,
    },
    "30 days from now",
  );

  return { jti, familyId, token };
}

async function createVerificationToken(options: {
  userId: string;
  token: string;
  role?: string;
}): Promise<string> {
  const [record] = await db
    .insert(schema.appEmailVerificationTokensTable)
    .values({
      userId: options.userId,
      token: options.token,
      role: options.role,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    })
    .returning({ id: schema.appEmailVerificationTokensTable.id });

  assert.ok(record);
  return record.id;
}

function authCookies(sessionToken: string, csrfToken?: string): string {
  const cookies = [`${sessionTokenName}=${sessionToken}`];

  if (csrfToken) {
    cookies.push(`${csrfTokenName}=${csrfToken}`);
  }

  return cookies.join("; ");
}

async function getRefreshSession(jti: string) {
  const [session] = await db
    .select()
    .from(schema.appUserRefreshTokensTable)
    .where(eq(schema.appUserRefreshTokensTable.jti, jti))
    .limit(1);

  return session;
}

test("sign-in failures use the same response for missing, unverified, and wrong-password users", async () => {
  const unverifiedUser = await createUser({ isVerified: false });
  const verifiedUser = await createUser({ isVerified: true });
  const missingEmail = `missing-auth-security-${uid()}@example.com`;

  const responses = await Promise.all([
    request(app).post(`${AUTH_BASE_URL}/sign-in`).send({
      email: missingEmail,
      password: VALID_PASSWORD,
    }),
    request(app).post(`${AUTH_BASE_URL}/sign-in`).send({
      email: unverifiedUser.email,
      password: VALID_PASSWORD,
    }),
    request(app).post(`${AUTH_BASE_URL}/sign-in`).send({
      email: verifiedUser.email,
      password: "WrongPassword123!",
    }),
  ]);

  for (const response of responses) {
    assert.equal(response.status, 400, response.text);
    assert.equal(response.body.success, false);
    assert.equal(response.body.message, "Email or password is incorrect.");
    assert.doesNotMatch(response.text, /not found|not verified|verify/i);
  }
});

test("forgot-password response is neutral for existing and unknown emails", async () => {
  const verifiedUser = await createUser({ isVerified: true });
  const unknownEmail = `unknown-auth-security-${uid()}@example.com`;

  const unknownResponse = await request(app)
    .post(`${AUTH_BASE_URL}/forgot-password`)
    .set("x-site-context", "main")
    .send({ email: unknownEmail });

  const existingResponse = await request(app)
    .post(`${AUTH_BASE_URL}/forgot-password`)
    .set("x-site-context", "main")
    .send({ email: verifiedUser.email });

  assert.equal(unknownResponse.status, 200, unknownResponse.text);
  assert.equal(existingResponse.status, 200, existingResponse.text);
  assert.equal(existingResponse.body.message, unknownResponse.body.message);
  assert.equal(
    existingResponse.body.message,
    "If an account exists for that email, a password reset link will be sent.",
  );
  assert.equal(existingResponse.body.token, undefined);
  assert.equal(existingResponse.body.data, undefined);
  assert.equal(existingResponse.body.verificationLink, undefined);

  const tokenRecords = await db
    .select({ id: schema.appEmailVerificationTokensTable.id })
    .from(schema.appEmailVerificationTokensTable)
    .where(eq(schema.appEmailVerificationTokensTable.userId, verifiedUser.id));

  assert.equal(tokenRecords.length, 1);
});

test("public signup availability checks return only constrained boolean state", async () => {
  const verifiedUser = await createUser({ isVerified: true });

  const emailResponse = await request(app)
    .post(`${AUTH_BASE_URL}/check-email-uniqueness`)
    .send({ email: verifiedUser.email });

  assert.equal(emailResponse.status, 200, emailResponse.text);
  assert.deepEqual(emailResponse.body.data, { isUnique: false });
  assert.equal(emailResponse.body.id, undefined);
  assert.equal(emailResponse.body.isVerified, undefined);
});

test("sign-out rejects missing CSRF token and revokes the session when CSRF is valid", async () => {
  const userWithoutCsrf = await createUser({ isVerified: true });
  const sessionWithoutCsrf = await createSession({
    userId: userWithoutCsrf.id,
    email: userWithoutCsrf.email,
  });

  const missingCsrfResponse = await request(app)
    .post(`${AUTH_BASE_URL}/sign-out`)
    .set("Origin", "http://localhost:3000")
    .set("Cookie", authCookies(sessionWithoutCsrf.token));

  assert.equal(missingCsrfResponse.status, 403, missingCsrfResponse.text);
  assert.match(missingCsrfResponse.body.message, /csrf validation failed/i);

  const user = await createUser({ isVerified: true });
  const session = await createSession({
    userId: user.id,
    email: user.email,
  });
  const csrfToken = generateCsrfToken(user.id);

  const response = await request(app)
    .post(`${AUTH_BASE_URL}/sign-out`)
    .set("Origin", "http://localhost:3000")
    .set("Cookie", authCookies(session.token, csrfToken))
    .set(csrfHeaderName, csrfToken);

  assert.equal(response.status, 200, response.text);
  assert.equal(response.body.success, true);

  const revokedSession = await getRefreshSession(session.jti);
  assert.ok(revokedSession?.revokedAt);
});

test("reset-password revokes all active sessions and consumes the reset token", async () => {
  const user = await createUser({ isVerified: true });
  const firstSession = await createSession({
    userId: user.id,
    email: user.email,
  });
  const secondSession = await createSession({
    userId: user.id,
    email: user.email,
  });

  const resetToken = await encrypt({ email: user.email }, "15 mins from now");
  await createVerificationToken({
    userId: user.id,
    token: resetToken,
  });

  const response = await request(app)
    .post(`${AUTH_BASE_URL}/reset-password`)
    .set("x-site-context", "main")
    .send({
      token: resetToken,
      email: user.email,
      password: NEW_PASSWORD,
      confirmPassword: NEW_PASSWORD,
    });

  assert.equal(response.status, 200, response.text);
  assert.equal(response.body.message, "Password reset successfully");

  const [firstRevokedSession, secondRevokedSession] = await Promise.all([
    getRefreshSession(firstSession.jti),
    getRefreshSession(secondSession.jti),
  ]);

  assert.ok(firstRevokedSession?.revokedAt);
  assert.ok(secondRevokedSession?.revokedAt);

  const remainingTokens = await db
    .select({ id: schema.appEmailVerificationTokensTable.id })
    .from(schema.appEmailVerificationTokensTable)
    .where(eq(schema.appEmailVerificationTokensTable.userId, user.id));

  assert.equal(remainingTokens.length, 0);

  const [updatedUser] = await db
    .select({ password: schema.appUsersTable.password })
    .from(schema.appUsersTable)
    .where(eq(schema.appUsersTable.id, user.id))
    .limit(1);

  assert.ok(updatedUser);
  assert.equal(await compare(NEW_PASSWORD, updatedUser.password), true);
});

test("replaying a rotated session token revokes the whole session family", async () => {
  const user = await createUser({ isVerified: true });
  const replayedJti = randomUUID();
  const successorJti = randomUUID();
  const consumedSuccessorJti = randomUUID();
  const familyId = randomUUID();

  await db.insert(schema.appUserRefreshTokensTable).values([
    {
      jti: replayedJti,
      familyId,
      userId: user.id,
      rotatedTo: successorJti,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ip: "127.0.0.1",
      deviceInfo: "{}",
    },
    {
      jti: successorJti,
      familyId,
      userId: user.id,
      rotatedTo: consumedSuccessorJti,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ip: "127.0.0.1",
      deviceInfo: "{}",
    },
  ]);
  createdSessionJtis.push(replayedJti, successorJti);

  const replayedToken = await encrypt(
    {
      id: user.id,
      email: user.email,
      jti: replayedJti,
      familyId,
    },
    "30 days from now",
  );

  const response = await request(app)
    .get(`${AUTH_BASE_URL}/session-info`)
    .set("Cookie", authCookies(replayedToken));

  assert.equal(response.status, 401, response.text);

  const familySessions = await db
    .select({
      jti: schema.appUserRefreshTokensTable.jti,
      revokedAt: schema.appUserRefreshTokensTable.revokedAt,
    })
    .from(schema.appUserRefreshTokensTable)
    .where(eq(schema.appUserRefreshTokensTable.familyId, familyId));

  assert.equal(familySessions.length, 2);
  assert.equal(
    familySessions.every((session) => session.revokedAt !== null),
    true,
  );
});
