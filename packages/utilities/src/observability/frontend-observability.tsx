"use client";

import {
  faro,
  getWebInstrumentations,
  initializeFaro,
  LogLevel,
} from "@grafana/faro-web-sdk";
// import { TracingInstrumentation } from '@grafana/faro-web-tracing';

interface FaroConfig {
  url?: string;
  appName: string;
  namespace?: string;
  version?: string;
  environment?: string;
}

export default function FrontendObservability({
  config,
}: {
  config?: Partial<FaroConfig>;
}) {
  // skip if already initialized
  if (faro.api) {
    return null;
  }

  // Get configuration from environment variables or passed config
  const faroUrl = config?.url || process.env.NEXT_PUBLIC_FARO_URL;

  if (!faroUrl) {
    console.warn(
      "Faro URL not configured, skipping observability initialization",
    );
    return null;
  }

  try {
    initializeFaro({
      url: faroUrl,
      app: {
        name:
          config?.appName || process.env.NEXT_PUBLIC_FARO_APP_NAME || "app",
        namespace:
          config?.namespace ||
          process.env.NEXT_PUBLIC_FARO_APP_NAMESPACE ||
          undefined,
        version:
          config?.version ||
          process.env.NEXT_PUBLIC_FARO_APP_VERSION ||
          "1.0.0",
        environment:
          config?.environment ||
          process.env.NEXT_PUBLIC_FARO_ENVIRONMENT ||
          process.env.NODE_ENV ||
          "development",
      },
      instrumentations: [
        ...getWebInstrumentations({
          captureConsole: true,
          captureConsoleDisabledLevels: [LogLevel.DEBUG, LogLevel.TRACE],
        }),
        // new TracingInstrumentation(),
      ],
    });
  } catch {
    return null;
  }
  return null;
}
