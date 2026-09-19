import { z } from 'zod';
import type {
  RobotsConfigValidationSchemaType,
  SitemapConfigValidationSchemaType,
  SiteSeoSettingsDraftPayloadValidationSchemaType,
} from '@repo/schemas-types/payload-schemas/content/site-seo-settings/payload.schema';
import type { SiteSeoSettingsVersionResponseType } from '@repo/schemas-types/payload-schemas/content/site-seo-settings/response.schema';

// Flat, always-present form shape. Kept permissive on purpose — the backend is
// the single source of truth for validation (see SiteSeoSettingsDraftPayloadValidationSchema);
// this schema only gives react-hook-form/zodResolver a concrete shape to bind to.
export const SeoSettingsFormSchema = z.object({
  titleTemplate: z.string(),
  metaDescription: z.string(),
  metaKeywords: z.string(),
  canonicalBaseUrl: z.string(),

  ogTitle: z.string(),
  ogDescription: z.string(),
  ogImageUrl: z.string(),
  ogType: z.string(),
  twitterCard: z.string(),
  twitterHandle: z.string(),
  faviconUrl: z.string(),

  googleSiteVerification: z.string(),
  bingSiteVerification: z.string(),
  googleAnalyticsId: z.string(),

  orgName: z.string(),
  orgLogoUrl: z.string(),
  orgSameAs: z.array(z.object({ url: z.string() })),

  robotsMode: z.enum(['structured', 'raw']),
  robotsRules: z.array(
    z.object({
      userAgent: z.string(),
      allow: z.string(),
      disallow: z.string(),
      crawlDelay: z.string(),
    }),
  ),
  robotsRawContent: z.string(),

  sitemapMode: z.enum(['structured', 'raw']),
  sitemapCustomUrls: z.array(
    z.object({
      path: z.string(),
      changeFrequency: z.string(),
      priority: z.string(),
    }),
  ),
  sitemapRawContent: z.string(),
});

export type SeoSettingsFormValues = z.infer<typeof SeoSettingsFormSchema>;

export const EMPTY_SEO_SETTINGS_FORM_VALUES: SeoSettingsFormValues = {
  titleTemplate: '',
  metaDescription: '',
  metaKeywords: '',
  canonicalBaseUrl: '',
  ogTitle: '',
  ogDescription: '',
  ogImageUrl: '',
  ogType: 'website',
  twitterCard: '',
  twitterHandle: '',
  faviconUrl: '',
  googleSiteVerification: '',
  bingSiteVerification: '',
  googleAnalyticsId: '',
  orgName: '',
  orgLogoUrl: '',
  orgSameAs: [],
  robotsMode: 'structured',
  robotsRules: [{ userAgent: '*', allow: '', disallow: '', crawlDelay: '' }],
  robotsRawContent: '',
  sitemapMode: 'structured',
  sitemapCustomUrls: [],
  sitemapRawContent: '',
};

const splitList = (value: string): string[] =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

export const toFormValues = (
  data: SiteSeoSettingsVersionResponseType | null,
): SeoSettingsFormValues => {
  if (!data) return EMPTY_SEO_SETTINGS_FORM_VALUES;

  return {
    titleTemplate: data.titleTemplate ?? '',
    metaDescription: data.metaDescription ?? '',
    metaKeywords: data.metaKeywords ?? '',
    canonicalBaseUrl: data.canonicalBaseUrl ?? '',
    ogTitle: data.ogTitle ?? '',
    ogDescription: data.ogDescription ?? '',
    ogImageUrl: data.ogImageUrl ?? '',
    ogType: data.ogType ?? 'website',
    twitterCard: data.twitterCard ?? '',
    twitterHandle: data.twitterHandle ?? '',
    faviconUrl: data.faviconUrl ?? '',
    googleSiteVerification: data.googleSiteVerification ?? '',
    bingSiteVerification: data.bingSiteVerification ?? '',
    googleAnalyticsId: data.googleAnalyticsId ?? '',
    orgName: data.organizationJsonLd?.name ?? '',
    orgLogoUrl: data.organizationJsonLd?.logoUrl ?? '',
    orgSameAs: (data.organizationJsonLd?.sameAs ?? []).map((url) => ({ url })),
    robotsMode: data.robots.mode,
    robotsRules:
      data.robots.mode === 'structured' && data.robots.rules.length > 0
        ? data.robots.rules.map((rule) => ({
            userAgent: rule.userAgent,
            allow: (rule.allow ?? []).join(', '),
            disallow: (rule.disallow ?? []).join(', '),
            crawlDelay: rule.crawlDelay != null ? String(rule.crawlDelay) : '',
          }))
        : EMPTY_SEO_SETTINGS_FORM_VALUES.robotsRules,
    robotsRawContent: data.robots.mode === 'raw' ? data.robots.rawContent : '',
    sitemapMode: data.sitemap.mode,
    sitemapCustomUrls:
      data.sitemap.mode === 'structured'
        ? data.sitemap.customUrls.map((url) => ({
            path: url.path,
            changeFrequency: url.changeFrequency ?? '',
            priority: url.priority != null ? String(url.priority) : '',
          }))
        : [],
    sitemapRawContent: data.sitemap.mode === 'raw' ? data.sitemap.rawContent : '',
  };
};

export const toPayload = (
  values: SeoSettingsFormValues,
): SiteSeoSettingsDraftPayloadValidationSchemaType => {
  const robots: RobotsConfigValidationSchemaType =
    values.robotsMode === 'raw'
      ? { mode: 'raw', rawContent: values.robotsRawContent }
      : {
          mode: 'structured',
          rules: values.robotsRules
            .filter((rule) => rule.userAgent.trim().length > 0)
            .map((rule) => ({
              userAgent: rule.userAgent.trim(),
              allow: splitList(rule.allow),
              disallow: splitList(rule.disallow),
              crawlDelay: rule.crawlDelay ? Number(rule.crawlDelay) : null,
            })),
        };

  const sitemap: SitemapConfigValidationSchemaType =
    values.sitemapMode === 'raw'
      ? { mode: 'raw', rawContent: values.sitemapRawContent }
      : {
          mode: 'structured',
          customUrls: values.sitemapCustomUrls
            .filter((url) => url.path.trim().length > 0)
            .map((url) => ({
              path: url.path.trim(),
              changeFrequency:
                (url.changeFrequency as SitemapConfigValidationSchemaType extends {
                  customUrls: Array<infer U>;
                }
                  ? U extends { changeFrequency: infer F }
                    ? F
                    : never
                  : never) || null,
              priority: url.priority ? Number(url.priority) : null,
            })),
        };

  return {
    titleTemplate: values.titleTemplate || null,
    metaDescription: values.metaDescription || null,
    metaKeywords: values.metaKeywords || null,
    canonicalBaseUrl: values.canonicalBaseUrl || null,
    ogTitle: values.ogTitle || null,
    ogDescription: values.ogDescription || null,
    ogImageUrl: values.ogImageUrl || null,
    ogType: values.ogType || null,
    twitterCard: values.twitterCard || null,
    twitterHandle: values.twitterHandle || null,
    faviconUrl: values.faviconUrl || null,
    googleSiteVerification: values.googleSiteVerification || null,
    bingSiteVerification: values.bingSiteVerification || null,
    googleAnalyticsId: values.googleAnalyticsId || null,
    organizationJsonLd:
      values.orgName || values.orgLogoUrl || values.orgSameAs.length > 0
        ? {
            name: values.orgName || null,
            logoUrl: values.orgLogoUrl || null,
            sameAs: values.orgSameAs.map((item) => item.url).filter(Boolean),
          }
        : null,
    robots,
    sitemap,
  };
};
