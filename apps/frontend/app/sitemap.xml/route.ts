import { NextResponse } from 'next/server';
import { getPublishedSiteSeoSettings } from '@modules/content/seo/services/seo-service';

export const dynamic = 'force-dynamic';

const STATIC_ROUTES = ['/', '/auth/signin', '/auth/signup'];

const escapeXml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function GET() {
  const settings = await getPublishedSiteSeoSettings();
  const siteUrl = settings?.canonicalBaseUrl?.replace(/\/$/, '') ?? '';

  if (settings && settings.sitemap.mode === 'raw') {
    return new NextResponse(settings.sitemap.rawContent, {
      headers: { 'Content-Type': 'application/xml' },
    });
  }

  const customUrls =
    settings && settings.sitemap.mode === 'structured' ? settings.sitemap.customUrls : [];

  const urls = [
    ...STATIC_ROUTES.map((path) => ({ path, changeFrequency: null, priority: null })),
    ...customUrls,
  ];

  const body = urls
    .map((url) => {
      const loc = escapeXml(`${siteUrl}${url.path}`);
      const changefreq = url.changeFrequency ? `<changefreq>${url.changeFrequency}</changefreq>` : '';
      const priority = url.priority != null ? `<priority>${url.priority}</priority>` : '';
      return `<url><loc>${loc}</loc>${changefreq}${priority}</url>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
