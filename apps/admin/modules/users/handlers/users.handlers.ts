import { toast } from 'sonner';
import { handleErrorToast } from '@repo/utilities/errors/error-toasts';
import type { AdminCreateUserPayloadValidationSchemaType } from '@repo/schemas-types/payload-schemas/admin/users/payload.schema';
import * as usersService from '../services/users-service';

export const handleCreateUser = async (payload: AdminCreateUserPayloadValidationSchemaType) => {
  try {
    const result = await usersService.createUser(payload);
    toast.success('User created successfully');
    return result;
  } catch (error) {
    handleErrorToast(error, 'Failed to create user');
    throw error;
  }
};

export const handleUpdateUserRoles = async (id: string, roleIds: number[]) => {
  try {
    const result = await usersService.updateUserRoles(id, roleIds);
    toast.success('User roles updated successfully');
    return result;
  } catch (error) {
    handleErrorToast(error, 'Failed to update user roles');
    throw error;
  }
};

export const handleUpdateUserStatus = async (id: string, isDeleted: boolean) => {
  try {
    const result = await usersService.updateUserStatus(id, isDeleted);
    toast.success(isDeleted ? 'User deactivated successfully' : 'User activated successfully');
    return result;
  } catch (error) {
    handleErrorToast(error, 'Failed to update user status');
    throw error;
  }
};

export const handleBulkUpdateUserStatus = async (ids: string[], isDeleted: boolean) => {
  try {
    await usersService.bulkUpdateUserStatus(ids, isDeleted);
    toast.success(isDeleted ? 'Users deactivated successfully' : 'Users activated successfully');
  } catch (error) {
    handleErrorToast(error, 'Failed to update user status');
    throw error;
  }
};
