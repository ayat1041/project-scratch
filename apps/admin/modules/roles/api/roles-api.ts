import { fetchWithCookies } from '@repo/utilities/http/fetch-with-cookies';
import { fetchWithCookiesServer } from '@repo/utilities/http/fetch-with-cookies-server';
import { createApiError } from '@repo/utilities/errors/error-parsing';
import type { AdminCreateRolePayloadValidationSchemaType } from '@repo/schemas-types/payload-schemas/admin/roles/payload.schema';
import { PERMISSIONS_FOR_ROLE_FORM_ENDPOINTS, ROLES_ENDPOINTS as E } from './api-constants';

export interface RolePermissionSummary {
  id: number;
  name: string;
  description: string | null;
}

export interface RoleRecord {
  id: number;
  name: string;
  description: string | null;
  scope: string;
  isSystemRole: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: RolePermissionSummary[];
}

export interface RolesListApiResponse {
  data: RoleRecord[];
  pagination: { limit: number; offset: number; total: number; currentCount: number };
}

// SSR read — called directly from Presenter.tsx
export async function getRolesList(
  limit: number,
  offset: number,
  search?: string,
): Promise<RolesListApiResponse> {
  const response = await fetchWithCookiesServer(E.LIST(limit, offset, search), {
    method: 'GET',
    cache: 'no-store',
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw createApiError(result.message || 'Failed to load roles', response.status);
  }
  return { data: result.data, pagination: result.pagination };
}

// SSR read — the create/edit dialog's permission picker
export async function getAllPermissionsForRoleForm(): Promise<RolePermissionSummary[]> {
  const response = await fetchWithCookiesServer(PERMISSIONS_FOR_ROLE_FORM_ENDPOINTS.LIST(500), {
    method: 'GET',
    cache: 'no-store',
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw createApiError(result.message || 'Failed to load permissions', response.status);
  }
  return result.data;
}

export async function createRole(payload: AdminCreateRolePayloadValidationSchemaType): Promise<RoleRecord> {
  const response = await fetchWithCookies(E.CREATE(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw createApiError(result.message || 'Failed to create role', response.status);
  }
  return result.data[0];
}

export async function updateRole(
  id: number,
  payload: AdminCreateRolePayloadValidationSchemaType,
): Promise<RoleRecord> {
  const response = await fetchWithCookies(E.UPDATE(id), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw createApiError(result.message || 'Failed to update role', response.status);
  }
  return result.data[0];
}

export async function deleteRole(id: number): Promise<void> {
  const response = await fetchWithCookies(E.DELETE(id), { method: 'DELETE' });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw createApiError(result.message || 'Failed to delete role', response.status);
  }
}
