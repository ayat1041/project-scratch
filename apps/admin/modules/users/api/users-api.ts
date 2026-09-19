import { fetchWithCookies } from '@repo/utilities/http/fetch-with-cookies';
import { fetchWithCookiesServer } from '@repo/utilities/http/fetch-with-cookies-server';
import { createApiError } from '@repo/utilities/errors/error-parsing';
import type {
  AdminBulkUpdateUserStatusPayloadValidationSchemaType,
  AdminCreateUserPayloadValidationSchemaType,
  AdminUpdateUserRolesPayloadValidationSchemaType,
  AdminUpdateUserStatusPayloadValidationSchemaType,
} from '@repo/schemas-types/payload-schemas/admin/users/payload.schema';
import type {
  UserDetailResponseType,
  UserListItemResponseType,
} from '@repo/schemas-types/payload-schemas/admin/users/response.schema';
import { ROLES_FOR_USER_FORM_ENDPOINTS, USERS_ENDPOINTS as E } from './api-constants';

export interface UserStatusSummaryItem {
  value: string;
  label: string;
  count: number;
}

export interface UsersListApiResponse {
  data: UserListItemResponseType[];
  pagination: { limit: number; offset: number; totalItems: number; totalPages: number };
  counts: { statusSummary: UserStatusSummaryItem[] };
}

export interface RoleForUserForm {
  id: number;
  name: string;
}

// SSR read — called directly from Presenter.tsx
export async function getUsersList(
  limit: number,
  offset: number,
  search?: string,
  role?: string,
  status?: string,
): Promise<UsersListApiResponse> {
  const response = await fetchWithCookiesServer(E.LIST(limit, offset, search, role, status), {
    method: 'GET',
    cache: 'no-store',
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw createApiError(result.message || 'Failed to load users', response.status);
  }
  return { data: result.data, pagination: result.pagination, counts: result.counts };
}

export async function getUserDetail(id: string): Promise<UserDetailResponseType> {
  const response = await fetchWithCookiesServer(E.DETAIL(id), { method: 'GET', cache: 'no-store' });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw createApiError(result.message || 'Failed to load user', response.status);
  }
  return result.data;
}

// SSR read — the create dialog's role picker
export async function getAllRolesForUserForm(): Promise<RoleForUserForm[]> {
  const response = await fetchWithCookiesServer(ROLES_FOR_USER_FORM_ENDPOINTS.LIST(500), {
    method: 'GET',
    cache: 'no-store',
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw createApiError(result.message || 'Failed to load roles', response.status);
  }
  return result.data;
}

export async function createUser(
  payload: AdminCreateUserPayloadValidationSchemaType,
): Promise<UserDetailResponseType> {
  const response = await fetchWithCookies(E.CREATE(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw createApiError(result.message || 'Failed to create user', response.status);
  }
  return result.data;
}

export async function updateUserRoles(
  id: string,
  payload: AdminUpdateUserRolesPayloadValidationSchemaType,
): Promise<UserDetailResponseType> {
  const response = await fetchWithCookies(E.UPDATE_ROLES(id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw createApiError(result.message || 'Failed to update roles', response.status);
  }
  return result.data;
}

export async function updateUserStatus(
  id: string,
  payload: AdminUpdateUserStatusPayloadValidationSchemaType,
): Promise<UserDetailResponseType> {
  const response = await fetchWithCookies(E.UPDATE_STATUS(id), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw createApiError(result.message || 'Failed to update status', response.status);
  }
  return result.data;
}

export async function bulkUpdateUserStatus(
  payload: AdminBulkUpdateUserStatusPayloadValidationSchemaType,
): Promise<void> {
  const response = await fetchWithCookies(E.BULK_UPDATE_STATUS(), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw createApiError(result.message || 'Failed to update status', response.status);
  }
}
