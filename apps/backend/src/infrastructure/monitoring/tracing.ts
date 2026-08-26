import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { IS_PRODUCTION, IS_STAGING } from "@/constants/variables";
const privateIP = process.env.PRIVATE_IP;
const monitoringHostIP = process.env.MONITORING_HOST_IP;

export const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: IS_PRODUCTION
      ? `http://${monitoringHostIP}:4318/v1/traces`
      : `http://${privateIP}:4318/v1/traces`,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
  serviceName: IS_STAGING
    ? "starter-api-staging"
    : IS_PRODUCTION
      ? "starter-api-production"
      : "starter-api-development",
});
