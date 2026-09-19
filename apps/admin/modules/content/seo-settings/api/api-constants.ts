export const SEO_SETTINGS_ENDPOINTS = {
  DRAFT: () => `/content/v1/seo-settings/draft`,
  PUBLISH: () => `/content/v1/seo-settings/publish`,
  VERSIONS: (limit: number, offset: number) =>
    `/content/v1/seo-settings/versions?limit=${limit}&offset=${offset}`,
  RESTORE_VERSION: (versionId: string) =>
    `/content/v1/seo-settings/versions/${versionId}/restore`,
} as const;
