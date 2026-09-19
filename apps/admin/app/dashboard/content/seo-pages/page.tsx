import type { Metadata } from 'next';
import SeoPagesPresenter from '@modules/content/seo-pages/components/Presenter';

export const metadata: Metadata = {
  title: 'SEO Pages',
};

interface SeoPagesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default function SeoPagesPage({ searchParams }: SeoPagesPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SEO Pages</h1>
        <p className="text-muted-foreground">
          Per-page title, description, and social overrides
        </p>
      </div>

      <SeoPagesPresenter searchParams={searchParams} />
    </div>
  );
}
