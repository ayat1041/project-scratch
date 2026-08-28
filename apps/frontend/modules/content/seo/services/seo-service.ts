import * as seoApi from '../api/seo-api';

export const getPublishedSiteSeoSettings = () => seoApi.getPublishedSiteSeoSettings();
export const getPageSeoOverride = (path: string) => seoApi.getPageSeoOverride(path);
