import type { Metadata } from 'next';
import SeoSettingsPresenter from '@modules/content/seo-settings/components/Presenter';

export const metadata: Metadata = {
  title: 'SEO Settings',
};

export default function SeoSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SEO Settings</h1>
        <p className="text-muted-foreground">
          Site-wide title, social, robots, sitemap, and verification settings
        </p>
      </div>

      <SeoSettingsPresenter />
    </div>
  );
}
