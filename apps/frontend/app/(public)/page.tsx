import type { Metadata } from 'next';
import FullWidthContainer from '@repo/ui/components/containers/FullWidthContainer';
import HomePage from '@modules/home/components/HomePage';

export const metadata: Metadata = {
  title: 'Starter — The production-grade full-stack template',
  description:
    'A pnpm/Turborepo monorepo with a layered Express + Drizzle backend, two Next.js 15 apps, a shared type system, Docker for local dev, and CI/CD from the first commit.',
};

export default function Home() {
  return (
    <FullWidthContainer>
      <HomePage />
    </FullWidthContainer>
  );
}
