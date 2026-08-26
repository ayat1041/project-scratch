/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/db/db";
import {
  appPermissionsTable,
  appPermissionToRolesTable,
  appRolesTable,
  appUsersTable,
  appUserRolesTable,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { jwtVerify, SignJWT } from "jose";
import RedisService from "@/infrastructure/cache/redis-client";
import { createError } from "@/middleware/error.middleware";
export function generateRandomCode(): number {
  return Math.floor(100000 + Math.random() * 900000);
}
export type JwtSignPayload = {
  id?: string;
  email?: string;
  role?: string;
  userName?: string;
  jti?: string;
  familyId?: string;
};

const key = new TextEncoder().encode(process.env.JWT_SECRET!);
const EXPIRED_TOKEN_CONTEXT_CLOCK_TOLERANCE_SECONDS = 10 * 365 * 24 * 60 * 60;

export async function encrypt(payload: JwtSignPayload, expiresTime: string) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresTime)
    .sign(key);
}

export type JwtPayload = {
  id?: number;
  email: string;
  iat: number;
  exp: number;
};

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    });

    return payload as JwtPayload;
  } catch (error: any) {
    return error;
  }
}

export async function decryptToken(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    });

    return payload as JwtPayload;
  } catch (error: any) {
    throw createError.badRequest("Invalid or Expired Link Submitted.", {
      error: error.message,
      hint: "Please provide a valid token.",
    });
  }
}

export async function decryptExpiredTokenContext(
  input: string,
): Promise<JwtSignPayload> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
      clockTolerance: EXPIRED_TOKEN_CONTEXT_CLOCK_TOLERANCE_SECONDS,
    });

    return payload as JwtSignPayload;
  } catch (error: any) {
    throw createError.badRequest("Invalid verification context.", {
      error: error.message,
      hint: "Please restart signup or request a fresh verification link.",
    });
  }
}

export async function verifySession(token: string): Promise<any> {
  const tokenData = await decrypt(token);
  if (tokenData.code === "ERR_JWT_EXPIRED") {
    return {
      message: "Token Expired",
      success: false,
    };
  }
  if (tokenData.code === "JWSSignatureVerificationFailed") {
    return {
      message: "Invalid Token Submitted",
      success: false,
    };
  }
  if (tokenData.userName) {
    return {
      data: tokenData,
      success: true,
    };
  }
  return {
    message: "Invalid Token",
    success: false,
  };
}

export const getPermissions = async (userId: string): Promise<any> => {
  // Check Redis cache first
  const cachedPermissions = await RedisService.get(
    `user:permissions:${userId}`,
  );
  if (cachedPermissions) {
    return cachedPermissions;
  }
  const response = await db
    .select({
      id: appUsersTable.id,
      permissions: sql<string>`STRING_AGG(DISTINCT ${appPermissionsTable.name}, ',')`,
    })
    .from(appUsersTable)
    .where(eq(appUsersTable.id, userId))
    .leftJoin(appUserRolesTable, eq(appUsersTable.id, appUserRolesTable.userId))
    .leftJoin(appRolesTable, eq(appUserRolesTable.roleId, appRolesTable.id))
    .leftJoin(
      appPermissionToRolesTable,
      eq(appRolesTable.id, appPermissionToRolesTable.roleId),
    )
    .leftJoin(
      appPermissionsTable,
      eq(appPermissionToRolesTable.permissionId, appPermissionsTable.id),
    )
    .groupBy(appUsersTable.id);

  const permissionsArray = response[0]?.permissions
    ? response[0].permissions.split(",").filter((p: string) => p)
    : [];
  if (permissionsArray) {
    await RedisService.set(`user:permissions:${userId}`, permissionsArray, 10);
  }
  return permissionsArray;
};

export async function decryptTokenData(token: string): Promise<any> {
  const tokenData = await decrypt(token);

  if (tokenData.code === "ERR_JWT_EXPIRED") {
    return {
      message: "Token Expired",
      success: false,
    };
  }
  if (tokenData.code === "JWSSignatureVerificationFailed") {
    return {
      message: "Invalid Token Submitted",
      success: false,
    };
  }

  if (tokenData.userName || tokenData.userData.userName) {
    return {
      data: tokenData,
      success: true,
    };
  }
  return {
    message: "Invalid Token",
    success: false,
  };
}
