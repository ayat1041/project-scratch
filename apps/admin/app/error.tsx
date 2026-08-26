'use client';

import SectionContainer from '@repo/ui/components/containers/SectionContainer';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SectionContainer className="flex min-h-screen items-center justify-center py-8 text-center">
      <div className="mx-auto w-full max-w-lg">
        {/* Error Icon */}
        <div className="mb-8 flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-orange-200">
            <svg
              className="text-primary h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-6">
          <div>
            <h1 className="text-font mb-3 text-5xl font-semibold md:text-7xl">
              Oops!
            </h1>
            <h2 className="text-font mb-4 text-lg font-medium md:text-2xl">
              Something went wrong
            </h2>
            <p className="text-text-muted text-base leading-relaxed md:text-lg">
              We&apos;re having trouble loading this page. This might be a
              temporary issue.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
            <button
              onClick={reset}
              className="text-background-card focus:ring-primary inline-flex min-w-[140px] items-center justify-center rounded-md bg-[image:var(--gradient-cta)] px-6 py-3 text-sm font-medium shadow-sm transition-all duration-200 hover:bg-[image:var(--gradient-cta-hover)] focus:ring-2 focus:ring-offset-2 focus:outline-none"
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Try Again
            </button>
            <Link
              href="/"
              className="text-font border-border bg-background-card hover:bg-gray-light focus:ring-primary inline-flex min-w-[140px] items-center justify-center rounded-md border px-6 py-3 text-sm font-medium shadow-sm transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none"
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Go Home
            </Link>
          </div>
        </div>

        {/* Debug info (only in development) */}
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-8 text-left">
            <summary className="text-text-muted hover:text-text cursor-pointer text-sm">
              Debug Information
            </summary>
            <pre className="bg-gray-light text-text mt-2 max-h-40 overflow-auto rounded-md p-4 text-sm">
              {error.message}
              {error.stack && '\n\nStack trace:\n' + error.stack}
            </pre>
          </details>
        )}
      </div>
    </SectionContainer>
  );
}
