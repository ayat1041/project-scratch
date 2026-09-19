import { toast } from 'sonner';
import { handleErrorToast } from '@repo/utilities/errors/error-toasts';
import type { AdminCreateRolePayloadValidationSchemaType } from '@repo/schemas-types/payload-schemas/admin/roles/payload.schema';
import * as rolesService from '../services/roles-service';

export const handleCreateRole = async (payload: AdminCreateRolePayloadValidationSchemaType) => {
  try {
    const result = await rolesService.createRole(payload);
    toast.success('Role created successfully');
    return result;
  } catch (error) {
    handleErrorToast(error, 'Failed to create role');
    throw error;
  }
};

export const handleUpdateRole = async (id: number, payload: AdminCreateRolePayloadValidationSchemaType) => {
  try {
    const result = await rolesService.updateRole(id, payload);
    toast.success('Role updated successfully');
    return result;
  } catch (error) {
    handleErrorToast(error, 'Failed to update role');
    throw error;
  }
};

export const handleDeleteRole = async (id: number) => {
  try {
    await rolesService.deleteRole(id);
    toast.success('Role deleted successfully');
  } catch (error) {
    handleErrorToast(error, 'Failed to delete role');
    throw error;
  }
};
