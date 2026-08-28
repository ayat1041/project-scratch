import { fetchWithCookies } from '@repo/utilities/http/fetch-with-cookies';
import { fetchWithCookiesServer } from '@repo/utilities/http/fetch-with-cookies-server';
import { createApiError } from '@repo/utilities/errors/error-parsing';
import type { AdminCreatePermissionPayloadValidationSchemaType } from '@repo/schemas-types/payload-schemas/admin/permissions/payload.schema';
import { PERMISSIONS_ENDPOINTS as E } from './api-constants';

export interface PermissionRecord {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  roleCount: number;
}

export interface PermissionsListApiResponse {
  data: PermissionRecord[];
  pagination: { limit: number; offset: number; total: number; currentCount: number };
}

export interface PermissionDetailApiResponse {
  permission: PermissionRecord;
  roles: { id: number; name: string }[];
}

// SSR read — called directly from Presenter.tsx
export async function getPermissionsList(
  limit: number,
  offset: number,
  search?: string,
): Promise<PermissionsListApiResponse> {
  const response = await fetchWithCookiesServer(E.LIST(limit, offset, search), {
    method: 'GET',
    cache: 'no-store',
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw createApiError(result.message || 'Failed to load permissions', response.status);
  }
  return { data: result.data, pagination: result.pagination };
}

export async function getPermissionDetail(id: number): Promise<PermissionDetailApiResponse> {
  const response = await fetchWithCookiesServer(E.DETAIL(id), { method: 'GET', cache: 'no-store' });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw createApiError(result.message || 'Failed to load permission', response.status);
  }
  return result.data;
}

export async function createPermission(
  payload: AdminCreatePermissionPayloadValidationSchemaType,
): Promise<PermissionRecord> {
  const response = await fetchWithCookies(E.CREATE(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw createApiError(result.message || 'Failed to create permission', response.status);
  }
  return result.data[0];
}

export async function updatePermission(
  id: number,
  payload: AdminCreatePermissionPayloadValidationSchemaType,
): Promise<PermissionRecord> {
  const response = await fetchWithCookies(E.UPDATE(id), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw createApiError(result.message || 'Failed to update permission', response.status);
  }
  return result.data[0];
}

export async function deletePermission(id: number): Promise<void> {
  const response = await fetchWithCookies(E.DELETE(id), { method: 'DELETE' });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw createApiError(result.message || 'Failed to delete permission', response.status);
  }
}

export async function bulkDeletePermissions(ids: number[]): Promise<void> {
  const response = await fetchWithCookies(E.BULK_DELETE(), {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw createApiError(result.message || 'Failed to delete permissions', response.status);
  }
}
