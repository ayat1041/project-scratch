export const PERMISSIONS_ENDPOINTS = {
  LIST: (limit: number, offset: number, search?: string) =>
    `/user-management/v1/permissions?limit=${limit}&offset=${offset}${
      search ? `&search=${encodeURIComponent(search)}` : ""
    }`,
  DETAIL: (id: number) => `/user-management/v1/permissions/${id}`,
  CREATE: () => `/user-management/v1/permissions`,
  UPDATE: (id: number) => `/user-management/v1/permissions/${id}`,
  DELETE: (id: number) => `/user-management/v1/permissions/${id}`,
  BULK_DELETE: () => `/user-management/v1/permissions`,
} as const;
