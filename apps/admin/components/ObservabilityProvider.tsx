'use client';

import dynamic from 'next/dynamic';

const FrontendObservability = dynamic(
  () => import('@repo/utilities/observability/frontend-observability'),
  { ssr: false }
);

export default function ObservabilityProvider() {
  return <FrontendObservability />;
}
