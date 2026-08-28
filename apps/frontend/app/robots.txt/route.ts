import { NextResponse } from 'next/server';
import { getPublishedSiteSeoSettings } from '@modules/content/seo/services/seo-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = await getPublishedSiteSeoSettings();

  if (!settings) {
    return new NextResponse('User-agent: *\nDisallow: /\n', {
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  if (settings.robots.mode === 'raw') {
    return new NextResponse(settings.robots.rawContent, {
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const lines: string[] = [];
  for (const rule of settings.robots.rules) {
    lines.push(`User-agent: ${rule.userAgent}`);
    for (const allow of rule.allow) lines.push(`Allow: ${allow}`);
    for (const disallow of rule.disallow) lines.push(`Disallow: ${disallow}`);
    if (rule.crawlDelay != null) lines.push(`Crawl-delay: ${rule.crawlDelay}`);
    lines.push('');
  }

  const siteUrl = settings.canonicalBaseUrl?.replace(/\/$/, '');
  if (siteUrl) lines.push(`Sitemap: ${siteUrl}/sitemap.xml`);

  return new NextResponse(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain' },
  });
}
