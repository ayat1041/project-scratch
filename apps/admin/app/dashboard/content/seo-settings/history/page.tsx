import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import SeoSettingsHistoryPresenter from '@modules/content/seo-settings/components/HistoryPresenter';

export const metadata: Metadata = {
  title: 'SEO Settings — Version History',
};

export default function SeoSettingsHistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/content/seo-settings"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to SEO Settings
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Version History</h1>
        <p className="text-muted-foreground">
          Restore an earlier version into the current draft
        </p>
      </div>

      <SeoSettingsHistoryPresenter />
    </div>
  );
}
