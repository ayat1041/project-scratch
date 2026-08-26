import type { Metadata } from 'next';
import FullWidthContainer from '@repo/ui/components/containers/FullWidthContainer';
import SectionContainer from '@repo/ui/components/containers/SectionContainer';

export const metadata: Metadata = {
  title: 'Starter',
  description: 'A generic SaaS starter template.',
};

export default function Home() {
  return (
    <>
      <FullWidthContainer>
        <SectionContainer>
          <div className="text-center">
            <h1 className="text-font mb-8 text-4xl font-bold">Starter</h1>
          </div>
        </SectionContainer>
      </FullWidthContainer>
    </>
  );
}
