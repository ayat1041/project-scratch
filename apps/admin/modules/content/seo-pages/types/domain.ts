import { z } from 'zod';
import type { SeoPageDraftPayloadValidationSchemaType } from '@repo/schemas-types/payload-schemas/content/seo-pages/payload.schema';
import type { SeoPageVersionResponseType } from '@repo/schemas-types/payload-schemas/content/seo-pages/response.schema';

// Kept permissive on purpose — the backend is the single source of truth for
// validation (see SeoPageDraftPayloadValidationSchema).
export const SeoPageFormSchema = z.object({
  title: z.string(),
  metaDescription: z.string(),
  metaKeywords: z.string(),
  canonicalUrl: z.string(),
  ogTitle: z.string(),
  ogDescription: z.string(),
  ogImageUrl: z.string(),
  noindex: z.boolean(),
  nofollow: z.boolean(),
  jsonLdType: z.string(),
  jsonLdDataJson: z.string(),
});

export type SeoPageFormValues = z.infer<typeof SeoPageFormSchema>;

export const EMPTY_SEO_PAGE_FORM_VALUES: SeoPageFormValues = {
  title: '',
  metaDescription: '',
  metaKeywords: '',
  canonicalUrl: '',
  ogTitle: '',
  ogDescription: '',
  ogImageUrl: '',
  noindex: false,
  nofollow: false,
  jsonLdType: '',
  jsonLdDataJson: '',
};

export const toFormValues = (
  data: SeoPageVersionResponseType | null,
): SeoPageFormValues => {
  if (!data) return EMPTY_SEO_PAGE_FORM_VALUES;

  return {
    title: data.title ?? '',
    metaDescription: data.metaDescription ?? '',
    metaKeywords: data.metaKeywords ?? '',
    canonicalUrl: data.canonicalUrl ?? '',
    ogTitle: data.ogTitle ?? '',
    ogDescription: data.ogDescription ?? '',
    ogImageUrl: data.ogImageUrl ?? '',
    noindex: data.noindex,
    nofollow: data.nofollow,
    jsonLdType: data.jsonLd?.type ?? '',
    jsonLdDataJson: data.jsonLd?.data ? JSON.stringify(data.jsonLd.data, null, 2) : '',
  };
};

export const toPayload = (
  values: SeoPageFormValues,
): SeoPageDraftPayloadValidationSchemaType => {
  let jsonLd: SeoPageDraftPayloadValidationSchemaType['jsonLd'] = null;

  if (values.jsonLdType.trim()) {
    let data: Record<string, unknown> = {};
    if (values.jsonLdDataJson.trim()) {
      try {
        data = JSON.parse(values.jsonLdDataJson);
      } catch {
        throw new Error('Structured data (JSON-LD) must be valid JSON');
      }
    }
    jsonLd = { type: values.jsonLdType.trim(), data };
  }

  return {
    title: values.title || null,
    metaDescription: values.metaDescription || null,
    metaKeywords: values.metaKeywords || null,
    canonicalUrl: values.canonicalUrl || null,
    ogTitle: values.ogTitle || null,
    ogDescription: values.ogDescription || null,
    ogImageUrl: values.ogImageUrl || null,
    noindex: values.noindex,
    nofollow: values.nofollow,
    jsonLd,
  };
};
