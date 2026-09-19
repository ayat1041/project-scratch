import { wrapZodError } from '@repo/utilities/errors/error-parsing';
import { AdminCreatePermissionPayloadValidationSchema } from '@repo/schemas-types/payload-schemas/admin/permissions/payload.schema';
import type { AdminCreatePermissionPayloadValidationSchemaType } from '@repo/schemas-types/payload-schemas/admin/permissions/payload.schema';
import * as permissionsApi from '../api/permissions-api';

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export const getPermissionsList = async (
  searchParams: Promise<Record<string, string | string[] | undefined>>,
) => {
  const params = await searchParams;
  const limit = Number(first(params.limit)) || 10;
  const offset = Number(first(params.offset)) || 0;
  const search = first(params.search);

  return permissionsApi.getPermissionsList(limit, offset, search);
};

export const getPermissionDetail = async (id: number) => {
  return permissionsApi.getPermissionDetail(id);
};

export const createPermission = async (payload: AdminCreatePermissionPayloadValidationSchemaType) => {
  try {
    const validated = AdminCreatePermissionPayloadValidationSchema.parse(payload);
    return await permissionsApi.createPermission(validated);
  } catch (error) {
    wrapZodError(error);
  }
};

export const updatePermission = async (
  id: number,
  payload: AdminCreatePermissionPayloadValidationSchemaType,
) => {
  try {
    const validated = AdminCreatePermissionPayloadValidationSchema.parse(payload);
    return await permissionsApi.updatePermission(id, validated);
  } catch (error) {
    wrapZodError(error);
  }
};

export const deletePermission = async (id: number) => {
  return permissionsApi.deletePermission(id);
};

export const bulkDeletePermissions = async (ids: number[]) => {
  return permissionsApi.bulkDeletePermissions(ids);
};
