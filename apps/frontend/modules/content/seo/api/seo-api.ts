import type { SiteSeoSettingsVersionResponseType } from '@repo/schemas-types/payload-schemas/content/site-seo-settings/response.schema';
import type { SeoPageVersionResponseType } from '@repo/schemas-types/payload-schemas/content/seo-pages/response.schema';

const API_URL = process.env.API_URL || '';
const REVALIDATE_SECONDS = 60;

// Public, unauthenticated reads consumed by generateMetadata/robots.txt/sitemap.xml
// on every request — must never throw, since a backend hiccup should not break
// the public site's page render.

export async function getPublishedSiteSeoSettings(): Promise<SiteSeoSettingsVersionResponseType | null> {
  try {
    const response = await fetch(`${API_URL}/content/v1/seo-settings/published`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export async function getPageSeoOverride(path: string): Promise<SeoPageVersionResponseType | null> {
  try {
    const response = await fetch(
      `${API_URL}/content/v1/seo-pages/public?path=${encodeURIComponent(path)}`,
      { next: { revalidate: REVALIDATE_SECONDS } },
    );
    if (!response.ok) return null;
    const result = await response.json();
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
