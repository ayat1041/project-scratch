export const USERS_ENDPOINTS = {
  LIST: (limit: number, offset: number, search?: string, role?: string, status?: string) =>
    `/user-management/v1/users?limit=${limit}&offset=${offset}${
      search ? `&search=${encodeURIComponent(search)}` : ''
    }${role ? `&role=${encodeURIComponent(role)}` : ''}${status ? `&status=${status}` : ''}`,
  DETAIL: (id: string) => `/user-management/v1/users/${id}`,
  CREATE: () => `/user-management/v1/users`,
  UPDATE_ROLES: (id: string) => `/user-management/v1/users/${id}/roles`,
  UPDATE_STATUS: (id: string) => `/user-management/v1/users/${id}/status`,
  BULK_UPDATE_STATUS: () => `/user-management/v1/users/status`,
} as const;

// Users' create dialog needs the full role catalog for its select. Deliberately
// independent of the `roles` module's own API layer — modules never reach into
// each other's internals.
export const ROLES_FOR_USER_FORM_ENDPOINTS = {
  LIST: (limit: number) => `/user-management/v1/roles?limit=${limit}&offset=0`,
} as const;
