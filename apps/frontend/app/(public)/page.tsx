import type { Metadata } from 'next';
import FullWidthContainer from '@repo/ui/components/containers/FullWidthContainer';
import HomePage from '@modules/home/components/HomePage';
import { getPageSeoOverride } from '@modules/content/seo/services/seo-service';
import { mergePageMetadata } from '@modules/content/seo/utils/build-metadata';

const FALLBACK_METADATA: Metadata = {
  title: 'Starter — The production-grade full-stack template',
  description:
    'A pnpm/Turborepo monorepo with a layered Express + Drizzle backend, two Next.js 15 apps, a shared type system, Docker for local dev, and CI/CD from the first commit.',
};

export async function generateMetadata(): Promise<Metadata> {
  const override = await getPageSeoOverride('/');
  return mergePageMetadata(FALLBACK_METADATA, override);
}

export default function Home() {
  return (
    <FullWidthContainer>
      <HomePage />
    </FullWidthContainer>
  );
}
