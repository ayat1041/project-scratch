export const SEO_PAGES_ENDPOINTS = {
  LIST: (limit: number, offset: number, search?: string) =>
    `/content/v1/seo-pages?limit=${limit}&offset=${offset}${
      search ? `&search=${encodeURIComponent(search)}` : ''
    }`,
  DETAIL: (id: string) => `/content/v1/seo-pages/${id}`,
  CREATE: () => `/content/v1/seo-pages`,
  SAVE_DRAFT: (id: string) => `/content/v1/seo-pages/${id}/draft`,
  PUBLISH: (id: string) => `/content/v1/seo-pages/${id}/publish`,
  DELETE: (id: string) => `/content/v1/seo-pages/${id}`,
  VERSIONS: (id: string) => `/content/v1/seo-pages/${id}/versions`,
} as const;
