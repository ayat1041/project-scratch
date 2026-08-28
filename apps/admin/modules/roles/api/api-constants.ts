export const ROLES_ENDPOINTS = {
  LIST: (limit: number, offset: number, search?: string) =>
    `/user-management/v1/roles?limit=${limit}&offset=${offset}${
      search ? `&search=${encodeURIComponent(search)}` : ''
    }`,
  CREATE: () => `/user-management/v1/roles`,
  UPDATE: (id: number) => `/user-management/v1/roles/${id}`,
  DELETE: (id: number) => `/user-management/v1/roles/${id}`,
} as const;

// Roles' create/edit form needs the full permission catalog for its checkbox
// picker. Deliberately independent of the `permissions` module's own API
// layer — modules never reach into each other's internals.
export const PERMISSIONS_FOR_ROLE_FORM_ENDPOINTS = {
  LIST: (limit: number) => `/user-management/v1/permissions?limit=${limit}&offset=0`,
} as const;
