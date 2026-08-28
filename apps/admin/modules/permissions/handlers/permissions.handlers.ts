import { toast } from 'sonner';
import { handleErrorToast } from '@repo/utilities/errors/error-toasts';
import type { AdminCreatePermissionPayloadValidationSchemaType } from '@repo/schemas-types/payload-schemas/admin/permissions/payload.schema';
import * as permissionsService from '../services/permissions-service';

export const handleCreatePermission = async (payload: AdminCreatePermissionPayloadValidationSchemaType) => {
  try {
    const result = await permissionsService.createPermission(payload);
    toast.success('Permission created successfully');
    return result;
  } catch (error) {
    handleErrorToast(error, 'Failed to create permission');
    throw error;
  }
};

export const handleUpdatePermission = async (
  id: number,
  payload: AdminCreatePermissionPayloadValidationSchemaType,
) => {
  try {
    const result = await permissionsService.updatePermission(id, payload);
    toast.success('Permission updated successfully');
    return result;
  } catch (error) {
    handleErrorToast(error, 'Failed to update permission');
    throw error;
  }
};

export const handleDeletePermission = async (id: number) => {
  try {
    await permissionsService.deletePermission(id);
    toast.success('Permission deleted successfully');
  } catch (error) {
    handleErrorToast(error, 'Failed to delete permission');
    throw error;
  }
};

export const handleBulkDeletePermissions = async (ids: number[]) => {
  try {
    await permissionsService.bulkDeletePermissions(ids);
    toast.success('Permissions deleted successfully');
  } catch (error) {
    handleErrorToast(error, 'Failed to delete permissions');
    throw error;
  }
};
