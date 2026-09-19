import { wrapZodError } from '@repo/utilities/errors/error-parsing';
import { AdminCreateRolePayloadValidationSchema } from '@repo/schemas-types/payload-schemas/admin/roles/payload.schema';
import type { AdminCreateRolePayloadValidationSchemaType } from '@repo/schemas-types/payload-schemas/admin/roles/payload.schema';
import * as rolesApi from '../api/roles-api';

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export const getRolesList = async (
  searchParams: Promise<Record<string, string | string[] | undefined>>,
) => {
  const params = await searchParams;
  const limit = Number(first(params.limit)) || 10;
  const offset = Number(first(params.offset)) || 0;
  const search = first(params.search);

  return rolesApi.getRolesList(limit, offset, search);
};

export const getAllPermissionsForRoleForm = async () => {
  return rolesApi.getAllPermissionsForRoleForm();
};

export const createRole = async (payload: AdminCreateRolePayloadValidationSchemaType) => {
  try {
    const validated = AdminCreateRolePayloadValidationSchema.parse(payload);
    return await rolesApi.createRole(validated);
  } catch (error) {
    wrapZodError(error);
  }
};

export const updateRole = async (id: number, payload: AdminCreateRolePayloadValidationSchemaType) => {
  try {
    const validated = AdminCreateRolePayloadValidationSchema.parse(payload);
    return await rolesApi.updateRole(id, validated);
  } catch (error) {
    wrapZodError(error);
  }
};

export const deleteRole = async (id: number) => {
  return rolesApi.deleteRole(id);
};
