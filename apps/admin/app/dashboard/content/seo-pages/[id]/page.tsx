import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import EditSeoPagePresenter from '@modules/content/seo-pages/components/edit/EditPresenter';

export const metadata: Metadata = {
  title: 'Edit SEO Page',
};

interface EditSeoPagePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSeoPagePage({ params }: EditSeoPagePageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/content/seo-pages"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to SEO Pages
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Edit SEO Page</h1>
      </div>

      <EditSeoPagePresenter id={id} />
    </div>
  );
}
