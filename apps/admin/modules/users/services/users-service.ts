import { wrapZodError } from '@repo/utilities/errors/error-parsing';
import {
  AdminBulkUpdateUserStatusPayloadValidationSchema,
  AdminCreateUserPayloadValidationSchema,
  AdminUpdateUserRolesPayloadValidationSchema,
  AdminUpdateUserStatusPayloadValidationSchema,
} from '@repo/schemas-types/payload-schemas/admin/users/payload.schema';
import type {
  AdminCreateUserPayloadValidationSchemaType,
} from '@repo/schemas-types/payload-schemas/admin/users/payload.schema';
import * as usersApi from '../api/users-api';

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export const getUsersList = async (
  searchParams: Promise<Record<string, string | string[] | undefined>>,
) => {
  const params = await searchParams;
  const limit = Number(first(params.limit)) || 10;
  const offset = Number(first(params.offset)) || 0;
  const search = first(params.search);
  const role = first(params.role);
  const status = first(params.status);

  return usersApi.getUsersList(limit, offset, search, role, status);
};

export const getUserDetail = async (id: string) => {
  return usersApi.getUserDetail(id);
};

export const getAllRolesForUserForm = async () => {
  return usersApi.getAllRolesForUserForm();
};

export const createUser = async (payload: AdminCreateUserPayloadValidationSchemaType) => {
  try {
    const validated = AdminCreateUserPayloadValidationSchema.parse(payload);
    return await usersApi.createUser(validated);
  } catch (error) {
    wrapZodError(error);
  }
};

export const updateUserRoles = async (id: string, roleIds: number[]) => {
  try {
    const validated = AdminUpdateUserRolesPayloadValidationSchema.parse({ roleIds });
    return await usersApi.updateUserRoles(id, validated);
  } catch (error) {
    wrapZodError(error);
  }
};

export const updateUserStatus = async (id: string, isDeleted: boolean) => {
  try {
    const validated = AdminUpdateUserStatusPayloadValidationSchema.parse({ isDeleted });
    return await usersApi.updateUserStatus(id, validated);
  } catch (error) {
    wrapZodError(error);
  }
};

export const bulkUpdateUserStatus = async (ids: string[], isDeleted: boolean) => {
  try {
    const validated = AdminBulkUpdateUserStatusPayloadValidationSchema.parse({ ids, isDeleted });
    return await usersApi.bulkUpdateUserStatus(validated);
  } catch (error) {
    wrapZodError(error);
  }
};
