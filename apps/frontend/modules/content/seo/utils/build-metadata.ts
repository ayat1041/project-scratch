import type { Metadata } from 'next';
import type { SeoPageVersionResponseType } from '@repo/schemas-types/payload-schemas/content/seo-pages/response.schema';

/**
 * Merges a page-level SEO override (admin-managed) on top of a page's own
 * hardcoded fallback metadata. The override wins field-by-field; anything it
 * leaves unset falls back to the page's own values.
 */
export function mergePageMetadata(
  fallback: Metadata,
  override: SeoPageVersionResponseType | null,
): Metadata {
  if (!override) return fallback;

  return {
    ...fallback,
    title: override.title || fallback.title,
    description: override.metaDescription || fallback.description,
    keywords: override.metaKeywords || undefined,
    alternates: override.canonicalUrl ? { canonical: override.canonicalUrl } : fallback.alternates,
    robots:
      override.noindex || override.nofollow
        ? {
            index: !override.noindex,
            follow: !override.nofollow,
          }
        : fallback.robots,
    openGraph: {
      ...fallback.openGraph,
      title: override.ogTitle || override.title || fallback.title || undefined,
      description: override.ogDescription || override.metaDescription || fallback.description || undefined,
      images: override.ogImageUrl ? [{ url: override.ogImageUrl }] : fallback.openGraph?.images,
    },
  };
}
